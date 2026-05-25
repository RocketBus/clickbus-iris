"""Tests for iris.analysis.pr_lifecycle.

Covers the cycle-time distribution metrics added so the platform's
"Cycle Time" dashboard section can aggregate per-repo numbers into an
org-wide view without re-storing every PR duration.
"""

from datetime import datetime, timedelta

from iris.analysis.pr_lifecycle import analyze_pr_lifecycle
from iris.models.pull_request import PullRequest


def _make_pr(number: int, hours_to_merge: float) -> PullRequest:
    """Build a merged PR whose open→merge duration is `hours_to_merge`."""
    created = datetime(2026, 1, 1, 9, 0, 0)
    merged = created + timedelta(hours=hours_to_merge)
    return PullRequest(
        number=number,
        title=f"PR #{number}",
        author="alice",
        created_at=created,
        additions=10,
        deletions=2,
        changed_files=3,
        merged_at=merged,
        closed_at=merged,
        state="merged",
    )


def test_returns_none_when_no_merged_prs():
    assert analyze_pr_lifecycle([]) is None


def test_buckets_cover_all_five_ranges():
    # One PR per bucket: 1h (same_day), 30h (one_day), 72h (two_to_three),
    # 150h (four_to_seven), 300h (seven_plus).
    prs = [
        _make_pr(1, 1.0),
        _make_pr(2, 30.0),
        _make_pr(3, 72.0),
        _make_pr(4, 150.0),
        _make_pr(5, 300.0),
    ]
    result = analyze_pr_lifecycle(prs)
    assert result is not None
    b = result.pr_cycle_time_buckets
    assert b.same_day == 1
    assert b.one_day == 1
    assert b.two_to_three_days == 1
    assert b.four_to_seven_days == 1
    assert b.seven_plus_days == 1


def test_pct_within_24h_counts_boundary_inclusive():
    # 24.0h must count as within 24h; 24.1h must not.
    prs = [_make_pr(1, 24.0), _make_pr(2, 24.1), _make_pr(3, 100.0)]
    result = analyze_pr_lifecycle(prs)
    assert result is not None
    assert result.pr_pct_merged_within_24h == round(1 / 3, 4)


def test_mean_and_p90_reflect_inputs():
    # Mean of [2, 4, 6, 8, 100] = 24.0; P90 (nearest-rank index 5) = 100.
    prs = [_make_pr(i, h) for i, h in enumerate([2.0, 4.0, 6.0, 8.0, 100.0], start=1)]
    result = analyze_pr_lifecycle(prs)
    assert result is not None
    assert result.pr_mean_time_to_merge_hours == 24.0
    assert result.pr_p90_time_to_merge_hours == 100.0


def test_ignores_non_merged_prs():
    open_pr = PullRequest(
        number=99,
        title="WIP",
        author="bob",
        created_at=datetime(2026, 1, 1),
        additions=1,
        deletions=0,
        changed_files=1,
        state="open",
    )
    merged_pr = _make_pr(1, 5.0)
    result = analyze_pr_lifecycle([open_pr, merged_pr])
    assert result is not None
    assert result.pr_merged_count == 1
