"""PR lifecycle analysis — computes delivery metrics from pull request data.

Metrics produced:
- pr_merged_count: Total PRs merged in the window
- pr_median_time_to_merge_hours: Median hours from open to merge
- pr_mean_time_to_merge_hours: Mean (average) hours from open to merge
- pr_p90_time_to_merge_hours: 90th percentile hours from open to merge
- pr_pct_merged_within_24h: Fraction of merged PRs whose cycle time was ≤ 24h
- pr_cycle_time_buckets: Counts of merged PRs across coarse duration buckets
  (same_day / one_day / two_to_three_days / four_to_seven_days / seven_plus_days)
- pr_median_size_files: Median changed files per PR
- pr_median_size_lines: Median total lines (additions + deletions) per PR
- pr_review_rounds_median: Median CHANGES_REQUESTED count per PR
- pr_single_pass_rate: Fraction of PRs merged without any CHANGES_REQUESTED

These metrics help measure how AI tooling affects the PR review cycle.
Thresholds are NOT defined here — this module only computes values.
"""

import math
from dataclasses import dataclass
from statistics import mean, median

from iris.models.pull_request import PullRequest


# Cycle-time bucket boundaries in hours. Buckets are right-exclusive
# except the last one, which is open-ended.
_BUCKET_SAME_DAY_MAX_H = 24.0
_BUCKET_ONE_DAY_MAX_H = 48.0
_BUCKET_TWO_TO_THREE_DAYS_MAX_H = 96.0  # up to (and including) 4 days from open
_BUCKET_FOUR_TO_SEVEN_DAYS_MAX_H = 192.0  # up to 8 days from open


@dataclass(frozen=True)
class CycleTimeBuckets:
    """Count of merged PRs whose open→merge duration falls in each bucket."""

    same_day: int
    one_day: int
    two_to_three_days: int
    four_to_seven_days: int
    seven_plus_days: int


@dataclass(frozen=True)
class PRLifecycleResult:
    """Results from PR lifecycle analysis."""

    pr_merged_count: int
    pr_median_time_to_merge_hours: float
    pr_mean_time_to_merge_hours: float
    pr_p90_time_to_merge_hours: float
    pr_pct_merged_within_24h: float
    pr_cycle_time_buckets: CycleTimeBuckets
    pr_median_size_files: int
    pr_median_size_lines: int
    pr_review_rounds_median: float
    pr_single_pass_rate: float


def analyze_pr_lifecycle(prs: list[PullRequest]) -> PRLifecycleResult | None:
    """Compute PR lifecycle metrics from a list of pull requests.

    Considers only merged PRs (others have no merged_at to compute
    time-to-merge from). Returns None when the input contains no
    merged PRs.

    Args:
        prs: PRs from github_reader (may include open/closed/merged).

    Returns:
        PRLifecycleResult with all metrics populated, or None.
    """
    merged = [pr for pr in prs if pr.state == "merged" and pr.merged_at is not None]
    count = len(merged)
    if count == 0:
        return None

    # Time to merge: hours between created_at and merged_at
    times_to_merge = [
        (pr.merged_at - pr.created_at).total_seconds() / 3600  # type: ignore[operator]
        for pr in merged
    ]

    # PR size: changed files and total lines (additions + deletions)
    sizes_files = [pr.changed_files for pr in merged]
    sizes_lines = [pr.additions + pr.deletions for pr in merged]

    # Review rounds: count of CHANGES_REQUESTED per PR
    review_rounds = [
        sum(1 for r in pr.reviews if r.state == "CHANGES_REQUESTED")
        for pr in merged
    ]

    # Single pass: PRs with zero CHANGES_REQUESTED
    single_pass_count = sum(1 for rounds in review_rounds if rounds == 0)

    buckets = _bucketize(times_to_merge)
    pct_within_24h = sum(1 for h in times_to_merge if h <= _BUCKET_SAME_DAY_MAX_H) / count

    return PRLifecycleResult(
        pr_merged_count=count,
        pr_median_time_to_merge_hours=round(median(times_to_merge), 1),
        pr_mean_time_to_merge_hours=round(mean(times_to_merge), 1),
        pr_p90_time_to_merge_hours=round(_percentile(times_to_merge, 0.9), 1),
        pr_pct_merged_within_24h=round(pct_within_24h, 4),
        pr_cycle_time_buckets=buckets,
        pr_median_size_files=int(median(sizes_files)),
        pr_median_size_lines=int(median(sizes_lines)),
        pr_review_rounds_median=round(median(review_rounds), 1),
        pr_single_pass_rate=round(single_pass_count / count, 2),
    )


def _percentile(values: list[float], p: float) -> float:
    """Return the p-th percentile (0.0–1.0) using nearest-rank.

    Nearest-rank is preferred over linear interpolation here because
    we report whole hours rounded to one decimal — interpolation noise
    would not survive that rounding anyway.
    """
    if not values:
        return 0.0
    ordered = sorted(values)
    # Nearest-rank index, 1-based then clamped. ceil keeps the
    # percentile monotonic and avoids Python's banker's rounding
    # quirks (e.g. round(4.5) == 4).
    rank = max(1, min(len(ordered), math.ceil(p * len(ordered))))
    return ordered[rank - 1]


def _bucketize(hours: list[float]) -> CycleTimeBuckets:
    """Count merged PR durations across the five reporting buckets."""
    same_day = 0
    one_day = 0
    two_three = 0
    four_seven = 0
    seven_plus = 0
    for h in hours:
        if h <= _BUCKET_SAME_DAY_MAX_H:
            same_day += 1
        elif h <= _BUCKET_ONE_DAY_MAX_H:
            one_day += 1
        elif h <= _BUCKET_TWO_TO_THREE_DAYS_MAX_H:
            two_three += 1
        elif h <= _BUCKET_FOUR_TO_SEVEN_DAYS_MAX_H:
            four_seven += 1
        else:
            seven_plus += 1
    return CycleTimeBuckets(
        same_day=same_day,
        one_day=one_day,
        two_to_three_days=two_three,
        four_to_seven_days=four_seven,
        seven_plus_days=seven_plus,
    )
