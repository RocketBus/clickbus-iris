"""Metrics data structures shared across Iris modules."""

from dataclasses import dataclass, asdict


@dataclass(frozen=True)
class ReportMetrics:
    """All metrics produced by a Iris analysis run.

    PR fields are optional — None when PR data is unavailable.
    """

    commits_total: int
    commits_revert: int
    revert_rate: float
    churn_events: int
    churn_lines_affected: int
    files_touched: int
    files_stabilized: int
    stabilization_ratio: float

    # Revert attribution (optional — None when no reverts or no origin data)
    revert_by_origin: dict[str, dict] | None = None
    revert_by_tool: dict[str, dict] | None = None

    # Fix targeting (optional — None when insufficient fix events)
    fix_target_by_origin: dict[str, dict] | None = None
    fix_target_by_tool: dict[str, dict] | None = None

    # Intent classification metrics (always populated in v0.2+)
    commit_intent_distribution: dict[str, int] | None = None
    churn_by_intent: dict[str, dict] | None = None
    stabilization_by_intent: dict[str, dict] | None = None
    lines_changed_by_intent: dict[str, int] | None = None

    # Origin classification metrics (optional — None when no non-human commits)
    ai_detection_coverage_pct: float | None = None  # % of commits with AI attribution
    commit_origin_distribution: dict[str, int] | None = None
    stabilization_by_origin: dict[str, dict] | None = None
    churn_by_origin: dict[str, dict] | None = None

    # Commit shape metrics (optional — None when no non-merge commits)
    commit_shape_by_origin: dict[str, dict] | None = None
    commit_shape_dominant: str | None = None

    # Fix latency metrics (optional — None when no rework events detected)
    fix_latency_median_hours: float | None = None
    fix_latency_by_origin: dict[str, dict] | None = None

    # Stability map (optional — None when no directories meet minimum threshold)
    stability_map: list[dict] | None = None

    # Correction cascade metrics (optional — None when insufficient data)
    cascade_rate: float | None = None
    cascade_rate_by_origin: dict[str, dict] | None = None
    cascade_rate_by_tool: dict[str, dict] | None = None
    cascade_median_depth: float | None = None

    # Code durability metrics (optional — None when git blame data unavailable)
    durability_by_origin: dict[str, dict] | None = None
    durability_by_tool: dict[str, dict] | None = None
    durability_files_analyzed: int | None = None

    # Acceptance rate metrics (optional — None when PR commit data unavailable)
    acceptance_by_origin: dict[str, dict] | None = None
    acceptance_by_tool: dict[str, dict] | None = None

    # Origin funnel (optional — None when origin data unavailable)
    origin_funnel: dict[str, dict] | None = None

    # Attribution gap (optional — None when no flagged commits)
    attribution_gap: dict | None = None

    # Churn detail (optional — None when insufficient churning files)
    churn_top_files: list[dict] | None = None
    churn_couplings: list[dict] | None = None

    # Activity timeline (optional — None when fewer than 2 weeks of data)
    activity_timeline: list[dict] | None = None
    activity_patterns: list[dict] | None = None

    # PR lifecycle metrics (optional — None when no GitHub data available)
    pr_merged_count: int | None = None
    pr_median_time_to_merge_hours: float | None = None
    # Cycle-time distribution — populated alongside pr_merged_count.
    # Together they let the platform reconstruct org-level distribution
    # by summing bucket counts across repos.
    pr_mean_time_to_merge_hours: float | None = None
    pr_p90_time_to_merge_hours: float | None = None
    pr_pct_merged_within_24h: float | None = None
    pr_cycle_time_buckets: dict[str, int] | None = None
    pr_median_size_files: int | None = None
    pr_median_size_lines: int | None = None
    pr_review_rounds_median: float | None = None
    pr_single_pass_rate: float | None = None

    # Duplicate block detection (optional — None when diff data unavailable)
    duplicate_block_rate: float | None = None
    duplicate_block_count: int | None = None
    duplicate_median_block_size: float | None = None
    duplicate_by_origin: dict[str, dict] | None = None
    duplicate_by_tool: dict[str, dict] | None = None

    # Moved code / refactoring health (optional — None when diff data unavailable)
    moved_code_pct: float | None = None
    refactoring_ratio: float | None = None
    move_by_origin: dict[str, dict] | None = None

    # Code provenance (optional — None when blame data unavailable)
    revision_age_distribution: dict[str, float] | None = None
    pct_revising_new_code: float | None = None
    pct_revising_mature_code: float | None = None
    provenance_by_origin: dict[str, dict] | None = None

    # New code churn rate (optional — None when insufficient data)
    new_code_churn_rate_2w: float | None = None
    new_code_churn_rate_4w: float | None = None
    new_code_churn_by_origin: dict[str, dict] | None = None
    new_code_churn_by_tool: dict[str, dict] | None = None

    # Operation classification (optional — None when diff data unavailable)
    operation_distribution: dict[str, float] | None = None
    operation_dominant: str | None = None
    operation_by_origin: dict[str, dict] | None = None

    # Flow Load — WIP per ISO week (optional — None when <2 buckets emerge)
    flow_load: list[dict] | None = None

    # Flow Efficiency (optional — None when no merged PR survives filters)
    flow_efficiency_median: float | None = None
    flow_efficiency_by_intent: dict[str, float] | None = None
    flow_efficiency_by_origin: dict[str, float] | None = None
    time_in_phase_median_hours: dict[str, float] | None = None
    median_time_to_first_review_hours: float | None = None

    # Human Review Coverage — fraction of merged PRs with genuine human review
    # (optional — None when no merged PR exists in the window). Disambiguates
    # pr_single_pass_rate: "merged in one pass" vs "no human ever looked".
    human_review_coverage_pct: float | None = None
    human_approval_coverage_pct: float | None = None
    human_review_coverage_by_intent: dict[str, float] | None = None
    human_review_coverage_by_origin_of_pr: dict[str, float] | None = None

    # Open PR Aging — snapshot of stuck inventory (optional — None when no
    # non-draft, non-bot open PR exists at coletion time).
    open_pr_count: int | None = None
    median_open_pr_age_days: float | None = None
    p90_open_pr_age_days: float | None = None
    stale_open_pr_pct: float | None = None
    very_stale_open_pr_pct: float | None = None
    abandonment_risk_pct: float | None = None
    median_open_pr_age_by_intent: dict[str, float] | None = None
    stale_open_pr_pct_by_origin: dict[str, float] | None = None

    # DORA (real) — populated only when external Datadog events were fetched
    # for this run. None across the board when the org has no active Datadog
    # integration. ``dora_source`` is "datadog" when populated, None otherwise.
    dora_source: str | None = None
    dora_deployments_total: int | None = None
    dora_deployments_failed: int | None = None
    dora_deployments_pending_evaluation: int | None = None
    dora_incidents_total: int | None = None
    dora_cfr: float | None = None
    dora_mttr_per_deploy_seconds_median: float | None = None
    dora_mttr_per_deploy_seconds_p90: float | None = None
    dora_mttr_per_incident_seconds_median: float | None = None
    dora_mttr_per_incident_seconds_p90: float | None = None
    dora_rollback_rate: float | None = None
    dora_rollbacks_total: int | None = None
    dora_lead_time_seconds_median: float | None = None
    dora_deploy_frequency_per_day: float | None = None
    dora_remediation_distribution: dict[str, int] | None = None

    # DORA by code origin — populated only when the analysis run had both
    # external DORA events AND local commit-origin classification (i.e. the
    # CLI ran on a real repo and fetched external events). The platform's
    # AI-vs-human correlation card (dashboard) keys off these.
    dora_cfr_by_origin: dict[str, dict] | None = None
    dora_rollback_rate_by_origin: dict[str, dict] | None = None
    # Org-wide attribution coverage for the by-origin breakdowns above:
    # known_origin_commits / total_referenced_commits. Low values mean the
    # window pulled deploys whose commits are older than the local commit
    # window — the by-origin numbers stay correct but represent a subset.
    dora_cfr_by_origin_coverage_pct: float | None = None

    def to_dict(self) -> dict:
        d = asdict(self)
        # Exclude None fields for backward compatibility
        return {k: v for k, v in d.items() if v is not None}
