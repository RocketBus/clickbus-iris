"""Tests for the Human Review Coverage analysis module.

Runnable as: `python -m pytest tests/test_human_review_coverage.py -v`
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from iris.analysis.human_review_coverage import (
    analyze_human_review_coverage,
    compute_coverage,
)
from iris.models.pull_request import CommitRef, PRReview, PullRequest


_BASE = datetime(2026, 4, 1, 0, 0, tzinfo=timezone.utc)


def _pr(
    *,
    number: int = 1,
    title: str = "feat: ship it",
    review_states: list[str] | None = None,
    review_authors: list[str] | None = None,
    state: str = "merged",
    commit_hashes: list[str] | None = None,
) -> PullRequest:
    """Build a merged PR with explicit review authors/states."""
    reviews: list[PRReview] = []
    states = review_states or []
    authors = review_authors or ["reviewer"] * len(states)
    for off, (st, author) in enumerate(zip(states, authors)):
        reviews.append(
            PRReview(
                author=author,
                state=st,
                submitted_at=_BASE + timedelta(hours=off + 1),
            )
        )

    refs = [
        CommitRef(hash=h, committed_at=_BASE - timedelta(hours=1))
        for h in (commit_hashes or [f"{number}a"])
    ]

    return PullRequest(
        number=number,
        title=title,
        author="alice",
        created_at=_BASE,
        merged_at=_BASE + timedelta(hours=24) if state == "merged" else None,
        state=state,  # type: ignore[arg-type]
        additions=0,
        deletions=0,
        changed_files=0,
        reviews=reviews,
        commit_refs=refs,
    )


# ---------------------------------------------------------------------------
# compute_coverage (per-PR intermediate)
# ---------------------------------------------------------------------------


def test_no_reviews_is_no_human_review():
    review, approval = compute_coverage(_pr(review_states=None))
    assert review is False
    assert approval is False


def test_bot_only_reviews_count_as_no_human_review():
    pr = _pr(
        review_states=["APPROVED"],
        review_authors=["kody-ai[bot]"],
    )
    review, approval = compute_coverage(pr)
    assert review is False
    assert approval is False


def test_mixed_bot_and_human_counts_as_human_review():
    pr = _pr(
        review_states=["APPROVED", "COMMENTED"],
        review_authors=["dependabot[bot]", "alice"],
    )
    review, approval = compute_coverage(pr)
    assert review is True
    # Human only COMMENTED; the only APPROVED is a bot → no human approval.
    assert approval is False


def test_human_approval_requires_non_bot_approved_state():
    pr = _pr(
        review_states=["COMMENTED", "APPROVED"],
        review_authors=["alice", "bob"],
    )
    review, approval = compute_coverage(pr)
    assert review is True
    assert approval is True


def test_human_comment_without_approval():
    pr = _pr(review_states=["COMMENTED"], review_authors=["alice"])
    review, approval = compute_coverage(pr)
    assert review is True
    assert approval is False


# ---------------------------------------------------------------------------
# analyze_human_review_coverage (window aggregation)
# ---------------------------------------------------------------------------


def test_returns_none_when_no_merged_pr():
    assert analyze_human_review_coverage([]) is None
    assert (
        analyze_human_review_coverage(
            [_pr(state="open"), _pr(state="closed")]
        )
        is None
    )


def test_non_merged_prs_excluded_from_denominator():
    # 1 merged reviewed by human + 1 open (ignored) → coverage 100%.
    prs = [
        _pr(number=1, review_states=["APPROVED"], review_authors=["alice"]),
        _pr(number=2, state="open", review_states=["APPROVED"], review_authors=["alice"]),
    ]
    result = analyze_human_review_coverage(prs)
    assert result is not None
    assert result.pr_count == 1
    assert result.human_review_coverage_pct == 1.0


def test_bot_only_pr_stays_in_denominator():
    # 1 human-reviewed, 1 bot-only → coverage 50%, not 100%.
    prs = [
        _pr(number=1, review_states=["APPROVED"], review_authors=["alice"]),
        _pr(number=2, review_states=["APPROVED"], review_authors=["kody-ai[bot]"]),
    ]
    result = analyze_human_review_coverage(prs)
    assert result is not None
    assert result.pr_count == 2
    assert result.human_review_coverage_pct == 0.5
    assert result.human_approval_coverage_pct == 0.5


def test_by_intent_respects_min_sample():
    prs = [
        _pr(number=i, title="feat: x", review_states=["APPROVED"], review_authors=["alice"])
        for i in range(10)
    ] + [
        _pr(number=100 + i, title="fix: x", review_states=["APPROVED"], review_authors=["alice"])
        for i in range(3)
    ]
    result = analyze_human_review_coverage(prs, min_sample=10)
    assert result is not None
    assert "FEATURE" in result.human_review_coverage_by_intent
    assert "FIX" not in result.human_review_coverage_by_intent  # only 3


def test_by_origin_uses_majority_rule_and_min_sample():
    # AI PR (human reviewed) + HUMAN PR (no human review).
    ai_pr = _pr(
        number=1,
        review_states=["APPROVED"],
        review_authors=["alice"],
        commit_hashes=["a1", "a2"],
    )
    human_pr = _pr(
        number=2,
        review_states=["APPROVED"],
        review_authors=["kody-ai[bot]"],
        commit_hashes=["h1", "h2"],
    )
    origin_map = {
        "a1": "AI_ASSISTED",
        "a2": "AI_ASSISTED",
        "h1": "HUMAN",
        "h2": "HUMAN",
    }
    result = analyze_human_review_coverage(
        [ai_pr, human_pr], commit_origin_map=origin_map, min_sample=1
    )
    assert result is not None
    assert result.human_review_coverage_by_origin_of_pr["AI_ASSISTED"] == 1.0
    assert result.human_review_coverage_by_origin_of_pr["HUMAN"] == 0.0


def test_by_origin_empty_without_origin_map():
    prs = [_pr(number=i, review_states=["APPROVED"], review_authors=["alice"]) for i in range(3)]
    result = analyze_human_review_coverage(prs, min_sample=1)
    assert result is not None
    assert result.human_review_coverage_by_origin_of_pr == {}
