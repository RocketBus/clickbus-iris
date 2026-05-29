"""Human Review Coverage — fraction of merged PRs a human actually reviewed.

``pr_single_pass_rate`` collapses two opposite realities into one number:
"a human reviewed and approved in a single pass" and "no human ever looked —
a bot approved or the author self-merged". As AI code-review tools (kody.ai,
Copilot Review, CodeRabbit, ...) become default, the share of PRs that receive
*genuine human review* drops without surfacing anywhere. A repo can show
``pr_single_pass_rate = 0.9`` (looks healthy) while most PRs go open→merge with
no human event at all.

This module measures, over a window of merged PRs:

- ``human_review_coverage_pct``   — fraction with at least one non-bot review
- ``human_approval_coverage_pct`` — fraction with at least one non-bot review
  whose ``state == "APPROVED"``

Both are complementary to Flow Efficiency: Flow Efficiency answers "of the
elapsed time, how much was active?"; this answers "how many PRs had a human
looking?". Read together they tell the full story (see docs/METRICS.md).

Privacy / ranking risk
----------------------
"Human review coverage" is a property of the *system*, never of a person.
``had_human_review`` is computed per PR as an intermediate but MUST NEVER appear
in the persisted output or UI — and it is never attributed to a specific
reviewer (Principle #2). Only window-level aggregates (overall, by intent, by
PR origin) are emitted. ``by_intent`` / ``by_origin_of_pr`` segments are
reported only when the segment has ``>= min_sample`` PRs.

Scope
-----
Merged PRs only. PRs with no reviews and bot-only PRs stay in the denominator
as ``False`` — filtering them out would inflate the metric and hide exactly the
behaviour we want to see. Bot detection reuses the same ``_BOT_AUTHOR_PATTERNS``
regex as ``origin_classifier`` (and Flow Efficiency), keeping one source of
truth for "bot".
"""

from collections import defaultdict
from dataclasses import dataclass, field

from iris.analysis.intent_classifier import classify_commit
from iris.analysis.origin_classifier import _BOT_AUTHOR_PATTERNS
from iris.models.commit import Commit
from iris.models.pull_request import PRReview, PullRequest


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class HumanReviewCoverageResult:
    """Aggregates for the analysis window. No per-PR data leaves the module."""

    human_review_coverage_pct: float
    human_approval_coverage_pct: float
    human_review_coverage_by_intent: dict[str, float] = field(default_factory=dict)
    human_review_coverage_by_origin_of_pr: dict[str, float] = field(
        default_factory=dict
    )
    pr_count: int = 0


DEFAULT_MIN_SAMPLE = 10  # aligned with Flow Efficiency


# ---------------------------------------------------------------------------
# Per-PR (intermediate — never persisted)
# ---------------------------------------------------------------------------


def compute_coverage(pr: PullRequest) -> tuple[bool, bool]:
    """Return ``(had_human_review, had_human_approval)`` for a single PR.

    ``had_human_review`` is True when any review was submitted by a non-bot
    author. ``had_human_approval`` additionally requires that review's state to
    be ``APPROVED``. A PR with no reviews, or only bot reviews, yields
    ``(False, False)``.
    """
    had_human_review = False
    had_human_approval = False
    for review in pr.reviews:
        if _is_bot_reviewer(review):
            continue
        had_human_review = True
        if review.state == "APPROVED":
            had_human_approval = True
    return had_human_review, had_human_approval


# ---------------------------------------------------------------------------
# Window aggregation
# ---------------------------------------------------------------------------


def analyze_human_review_coverage(
    prs: list[PullRequest],
    *,
    commit_origin_map: dict[str, str] | None = None,
    min_sample: int = DEFAULT_MIN_SAMPLE,
) -> HumanReviewCoverageResult | None:
    """Compute Human Review Coverage aggregates for a window of merged PRs.

    Args:
        prs: PRs from github_reader (any state — non-merged are skipped).
        commit_origin_map: optional ``hash → CommitOrigin.value`` lookup. When
            provided, ``human_review_coverage_by_origin_of_pr`` is populated
            using the same rule as Flow Efficiency: a PR is AI_ASSISTED when
            >= 50% of its non-bot classified commits are AI_ASSISTED, otherwise
            HUMAN; PRs with no classified commits are skipped from the segment.
        min_sample: minimum PRs per segment (intent or origin) to report.

    Returns:
        ``HumanReviewCoverageResult`` or ``None`` when no merged PR exists.
    """
    merged = [pr for pr in prs if pr.state == "merged" and pr.merged_at is not None]
    if not merged:
        return None

    reviewed_flags: list[bool] = []
    approved_flags: list[bool] = []
    by_intent: dict[str, list[bool]] = defaultdict(list)
    by_origin: dict[str, list[bool]] = defaultdict(list)

    for pr in merged:
        had_review, had_approval = compute_coverage(pr)
        reviewed_flags.append(had_review)
        approved_flags.append(had_approval)

        by_intent[_pr_intent(pr)].append(had_review)

        if commit_origin_map is not None:
            origin = _pr_origin(pr, commit_origin_map)
            if origin is not None:
                by_origin[origin].append(had_review)

    human_review_coverage_by_intent = {
        intent: _mean(flags)
        for intent, flags in by_intent.items()
        if len(flags) >= min_sample
    }
    human_review_coverage_by_origin_of_pr = {
        origin: _mean(flags)
        for origin, flags in by_origin.items()
        if len(flags) >= min_sample
    }

    return HumanReviewCoverageResult(
        human_review_coverage_pct=_mean(reviewed_flags),
        human_approval_coverage_pct=_mean(approved_flags),
        human_review_coverage_by_intent=human_review_coverage_by_intent,
        human_review_coverage_by_origin_of_pr=human_review_coverage_by_origin_of_pr,
        pr_count=len(merged),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _mean(flags: list[bool]) -> float:
    """Fraction of True values, rounded to 3 dp. Assumes non-empty input."""
    return round(sum(flags) / len(flags), 3)


def _is_bot_reviewer(review: PRReview) -> bool:
    """True when the reviewer's login matches a known bot pattern.

    Uses the same regex as ``origin_classifier`` so "bot" means the same thing
    across origin classification, Flow Efficiency, and this module.
    """
    return bool(_BOT_AUTHOR_PATTERNS.search(review.author or ""))


def _pr_intent(pr: PullRequest) -> str:
    """Classify the PR by its title, reusing the commit intent classifier."""
    synthetic = Commit(
        hash=f"pr-{pr.number}",
        author=pr.author,
        date=pr.created_at,
        message=pr.title,
    )
    return classify_commit(synthetic).intent.value


def _pr_origin(pr: PullRequest, origin_map: dict[str, str]) -> str | None:
    """Roll PR commit origins up to a single PR-level label.

    Rule: PR is AI_ASSISTED when at least 50% of its classifiable non-bot
    commits are AI_ASSISTED; otherwise HUMAN. Bot-authored commits are excluded
    from both numerator and denominator. PRs with no classified commits return
    ``None``.
    """
    non_bot = 0
    ai = 0
    for ref in pr.commit_refs:
        origin = origin_map.get(ref.hash)
        if origin is None or origin == "BOT":
            continue
        non_bot += 1
        if origin == "AI_ASSISTED":
            ai += 1
    if non_bot == 0:
        return None
    return "AI_ASSISTED" if (ai / non_bot) >= 0.5 else "HUMAN"
