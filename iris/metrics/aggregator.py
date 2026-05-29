"""Metrics aggregator — orchestrates all analysis modules and produces ReportMetrics.

This is the integration point between ingestion, analysis, and reporting.
It calls each analysis module and combines results into the final metrics
schema (see `iris.models.metrics.ReportMetrics`).
"""

from dataclasses import asdict

from iris.analysis.acceptance_rate import calculate_acceptance_rate
from iris.analysis.attribution_gap import detect_attribution_gap
from iris.analysis.activity_timeline import calculate_activity_timeline
from iris.analysis.cascade_detector import detect_cascades
from iris.analysis.churn_detail import calculate_churn_detail, render_chain
from iris.analysis.churn_calculator import calculate_churn
from iris.analysis.commit_shape import analyze_commit_shapes
from iris.analysis.dora_real import analyze_dora_real
from iris.analysis.fix_latency import calculate_fix_latency
from iris.analysis.flow_efficiency import analyze_flow_efficiency
from iris.analysis.human_review_coverage import analyze_human_review_coverage
from iris.analysis.open_pr_aging import analyze_open_pr_aging, now_utc
from iris.analysis.flow_load import analyze_flow_load
from iris.analysis.stability_map import calculate_stability_map
from iris.analysis.intent_classifier import classify_commits
from iris.analysis.intent_metrics import (
    compute_churn_by_intent,
    compute_intent_distribution,
    compute_stabilization_by_intent,
)
from iris.analysis.origin_classifier import CommitOrigin, build_tool_map, classify_origins
from iris.analysis.origin_metrics import (
    compute_churn_by_origin,
    compute_origin_distribution,
    compute_stabilization_by_origin,
)
from iris.analysis.pr_lifecycle import analyze_pr_lifecycle
from iris.analysis.fix_targeting import calculate_fix_targeting
from iris.analysis.revert_detector import detect_reverts
from iris.metrics.stabilization import calculate_stabilization
from iris.models.commit import Commit
from iris.models.external import ExternalDORAData
from iris.models.metrics import ReportMetrics
from iris.models.pull_request import PullRequest


def aggregate(
    commits: list[Commit],
    churn_days: int,
    prs: list[PullRequest] | None = None,
    external_data: ExternalDORAData | None = None,
) -> ReportMetrics:
    """Run all analyses on commits and return the combined ReportMetrics.

    Args:
        commits: Commits from git_reader (sorted by date ascending).
        churn_days: Churn/stabilization window in days.
        prs: Optional list of merged PRs from github_reader.
        external_data: Optional pre-fetched DORA events (deployments +
            incidents) from a connected provider — currently Datadog. When
            provided, populates the ``dora_*`` fields on ReportMetrics;
            when None, those fields stay None and the report renders the
            DORA section as "not available".

    Returns:
        ReportMetrics with all fields populated. PR fields are None
        when prs is None or empty.
    """
    churn_result = calculate_churn(commits, churn_days)
    stab_result = calculate_stabilization(commits, churn_days)

    # Intent classification (always runs — every commit can be classified)
    classified = classify_commits(commits)
    dist = compute_intent_distribution(classified)
    churn_by = compute_churn_by_intent(classified, churn_days)
    stab_by = compute_stabilization_by_intent(classified, churn_days)

    # Serialize intent results to plain dicts for ReportMetrics
    churn_by_dict = {
        k: {"churn_events": v.churn_events, "churn_lines_affected": v.churn_lines_affected}
        for k, v in churn_by.items()
    }
    stab_by_dict = {
        k: asdict(v)
        for k, v in stab_by.items()
    }

    # Origin classification — only populate when non-human commits exist
    origin_kwargs: dict = {}
    origin_classified = classify_origins(commits)
    tool_map = build_tool_map(origin_classified)

    # Revert detection (after origin classification to attribute reverts)
    origin_map = {c.hash: origin.value for c, origin in origin_classified}
    revert_result = detect_reverts(commits, origin_map=origin_map, tool_map=tool_map)
    origin_dist = compute_origin_distribution(origin_classified)
    has_non_human = (
        origin_dist.get(CommitOrigin.AI_ASSISTED.value, 0) > 0
        or origin_dist.get(CommitOrigin.BOT.value, 0) > 0
    )
    # AI detection coverage — always compute
    ai_count = origin_dist.get(CommitOrigin.AI_ASSISTED.value, 0)
    total_non_bot = sum(v for k, v in origin_dist.items() if k != CommitOrigin.BOT.value)
    if total_non_bot > 0:
        origin_kwargs["ai_detection_coverage_pct"] = round(
            ai_count / total_non_bot * 100, 1,
        )

    if has_non_human:
        origin_churn = compute_churn_by_origin(origin_classified, churn_days)
        origin_stab = compute_stabilization_by_origin(origin_classified, churn_days)
        origin_kwargs.update({
            "commit_origin_distribution": origin_dist,
            "churn_by_origin": {
                k: {"churn_events": v.churn_events, "churn_lines_affected": v.churn_lines_affected}
                for k, v in origin_churn.items()
            },
            "stabilization_by_origin": {
                k: asdict(v)
                for k, v in origin_stab.items()
            },
        })

    # Commit shape analysis
    shape_kwargs: dict = {}
    shape_result = analyze_commit_shapes(commits, origin_classified)
    if shape_result:
        shape_kwargs["commit_shape_dominant"] = shape_result.overall_profile.dominant_shape
        if shape_result.profiles_by_origin:
            shape_kwargs["commit_shape_by_origin"] = {
                p.origin: {
                    "commit_count": p.commit_count,
                    "median_files_changed": p.median_files_changed,
                    "median_total_lines": p.median_total_lines,
                    "median_lines_per_file": p.median_lines_per_file,
                    "median_directory_spread": p.median_directory_spread,
                    "dominant_shape": p.dominant_shape,
                }
                for p in shape_result.profiles_by_origin
            }

    # Fix latency (uses origin classification, works even with all-human commits)
    latency_kwargs: dict = {}
    latency_result = calculate_fix_latency(commits, origin_classified, churn_days)
    if latency_result:
        latency_kwargs["fix_latency_median_hours"] = latency_result.median_latency_hours
        if latency_result.by_origin:
            latency_kwargs["fix_latency_by_origin"] = {
                bo.origin: {
                    "median_latency_hours": bo.median_latency_hours,
                    "fast_rework_pct": bo.fast_rework_pct,
                    "rework_count": bo.rework_count,
                }
                for bo in latency_result.by_origin
            }

    # Correction cascades
    cascade_kwargs: dict = {}
    cascade_result = detect_cascades(commits, origin_classified, tool_map=tool_map)
    if cascade_result:
        cascade_kwargs["cascade_rate"] = cascade_result.cascade_rate
        cascade_kwargs["cascade_median_depth"] = cascade_result.median_cascade_depth
        if cascade_result.by_origin:
            cascade_kwargs["cascade_rate_by_origin"] = {
                bo.origin: {
                    "total_commits": bo.total_commits,
                    "cascades": bo.cascades,
                    "cascade_rate": bo.cascade_rate,
                    "median_depth": bo.median_depth,
                }
                for bo in cascade_result.by_origin
            }
        if cascade_result.by_tool:
            cascade_kwargs["cascade_rate_by_tool"] = {
                bt.tool: {
                    "total_commits": bt.total_commits,
                    "cascades": bt.cascades,
                    "cascade_rate": bt.cascade_rate,
                    "median_depth": bt.median_depth,
                }
                for bt in cascade_result.by_tool
            }

    # Stability map
    stability_kwargs: dict = {}
    stability_map_result = calculate_stability_map(commits, churn_days)
    if stability_map_result:
        stability_kwargs["stability_map"] = [
            {
                "directory": d.directory,
                "files_touched": d.files_touched,
                "files_stabilized": d.files_stabilized,
                "stabilization_ratio": d.stabilization_ratio,
                "churn_events": d.churn_events,
                "total_lines_changed": d.total_lines_changed,
            }
            for d in stability_map_result.directories
        ]

    # Attribution gap
    attrib_kwargs: dict = {}
    attrib_gap = detect_attribution_gap(commits)
    if attrib_gap:
        attrib_kwargs["attribution_gap"] = {
            "flagged_commits": attrib_gap.flagged_commits,
            "total_human_commits": attrib_gap.total_human_commits,
            "flagged_pct": attrib_gap.flagged_pct,
            "avg_loc": attrib_gap.avg_loc,
            "avg_files": attrib_gap.avg_files,
            "avg_interval_minutes": attrib_gap.avg_interval_minutes,
        }

    # Churn detail (chains + coupling)
    churn_detail_kwargs: dict = {}
    churn_detail = calculate_churn_detail(commits)
    if churn_detail:
        churn_detail_kwargs["churn_top_files"] = [
            {
                "file": f.file_path,
                "touches": f.touches,
                "total_lines": f.total_lines,
                "fix_count": f.fix_count,
                "chain": render_chain(f.chain),
                "first_touch": f.first_touch.strftime("%m/%d"),
                "last_touch": f.last_touch.strftime("%m/%d"),
            }
            for f in churn_detail.top_churning_files
        ]
        if churn_detail.couplings:
            churn_detail_kwargs["churn_couplings"] = [
                {
                    "file_a": c.file_a,
                    "file_b": c.file_b,
                    "co_occurrences": c.co_occurrences,
                    "coupling_rate": c.coupling_rate,
                }
                for c in churn_detail.couplings
            ]

    # Activity timeline
    timeline_kwargs: dict = {}
    timeline_result = calculate_activity_timeline(commits, churn_days, prs=prs)
    if timeline_result:
        timeline_kwargs["activity_timeline"] = [
            {
                "week_start": w.week_start.isoformat(),
                "week_end": w.week_end.isoformat(),
                "commits": w.commits,
                "lines_changed": w.lines_changed,
                "intent": w.intent_distribution,
                "origin": w.origin_distribution,
                "stabilization_ratio": w.stabilization_ratio,
                "churn_events": w.churn_events,
                "prs_merged": w.prs_merged,
                "pr_median_ttm_hours": w.pr_median_ttm_hours,
            }
            for w in timeline_result.weeks
        ]
        if timeline_result.patterns:
            timeline_kwargs["activity_patterns"] = [
                {
                    "pattern": p.pattern,
                    "week": p.week_label,
                    "description": p.description,
                }
                for p in timeline_result.patterns
            ]

    # Acceptance rate (requires PR data with commit hashes)
    acceptance_kwargs: dict = {}
    if prs:
        acceptance_result = calculate_acceptance_rate(commits, prs)
        if acceptance_result:
            if acceptance_result.by_origin:
                acceptance_kwargs["acceptance_by_origin"] = {
                    g.group: {
                        "total_commits": g.total_commits,
                        "commits_in_prs": g.commits_in_prs,
                        "pr_rate": g.pr_rate,
                        "single_pass_rate": g.single_pass_rate,
                        "median_review_rounds": g.median_review_rounds,
                    }
                    for g in acceptance_result.by_origin
                }
            if acceptance_result.by_tool:
                acceptance_kwargs["acceptance_by_tool"] = {
                    g.group: {
                        "total_commits": g.total_commits,
                        "commits_in_prs": g.commits_in_prs,
                        "pr_rate": g.pr_rate,
                        "single_pass_rate": g.single_pass_rate,
                        "median_review_rounds": g.median_review_rounds,
                    }
                    for g in acceptance_result.by_tool
                }

    # Flow Efficiency — active vs wait decomposition of merged PR lifecycle
    flow_efficiency_kwargs: dict = {}
    if prs:
        flow_efficiency_result = analyze_flow_efficiency(
            prs,
            commit_origin_map=origin_map,
        )
        if flow_efficiency_result is not None:
            flow_efficiency_kwargs["flow_efficiency_median"] = (
                flow_efficiency_result.flow_efficiency_median
            )
            flow_efficiency_kwargs["time_in_phase_median_hours"] = (
                flow_efficiency_result.time_in_phase_median_hours
            )
            if flow_efficiency_result.median_time_to_first_review_hours is not None:
                flow_efficiency_kwargs["median_time_to_first_review_hours"] = (
                    flow_efficiency_result.median_time_to_first_review_hours
                )
            if flow_efficiency_result.flow_efficiency_by_intent:
                flow_efficiency_kwargs["flow_efficiency_by_intent"] = (
                    flow_efficiency_result.flow_efficiency_by_intent
                )
            if flow_efficiency_result.flow_efficiency_by_origin:
                flow_efficiency_kwargs["flow_efficiency_by_origin"] = (
                    flow_efficiency_result.flow_efficiency_by_origin
                )

    # Human Review Coverage — fraction of merged PRs a human actually reviewed
    human_review_coverage_kwargs: dict = {}
    if prs:
        coverage_result = analyze_human_review_coverage(
            prs,
            commit_origin_map=origin_map,
        )
        if coverage_result is not None:
            human_review_coverage_kwargs["human_review_coverage_pct"] = (
                coverage_result.human_review_coverage_pct
            )
            human_review_coverage_kwargs["human_approval_coverage_pct"] = (
                coverage_result.human_approval_coverage_pct
            )
            if coverage_result.human_review_coverage_by_intent:
                human_review_coverage_kwargs["human_review_coverage_by_intent"] = (
                    coverage_result.human_review_coverage_by_intent
                )
            if coverage_result.human_review_coverage_by_origin_of_pr:
                human_review_coverage_kwargs[
                    "human_review_coverage_by_origin_of_pr"
                ] = coverage_result.human_review_coverage_by_origin_of_pr

    # Open PR Aging — snapshot of stuck inventory (non-draft, non-bot)
    open_pr_aging_kwargs: dict = {}
    if prs:
        aging_result = analyze_open_pr_aging(
            prs,
            now=now_utc(),
            commit_origin_map=origin_map,
        )
        if aging_result is not None:
            open_pr_aging_kwargs["open_pr_count"] = aging_result.open_pr_count
            open_pr_aging_kwargs["median_open_pr_age_days"] = (
                aging_result.median_open_pr_age_days
            )
            open_pr_aging_kwargs["p90_open_pr_age_days"] = (
                aging_result.p90_open_pr_age_days
            )
            open_pr_aging_kwargs["stale_open_pr_pct"] = (
                aging_result.stale_open_pr_pct
            )
            open_pr_aging_kwargs["very_stale_open_pr_pct"] = (
                aging_result.very_stale_open_pr_pct
            )
            open_pr_aging_kwargs["abandonment_risk_pct"] = (
                aging_result.abandonment_risk_pct
            )
            if aging_result.median_open_pr_age_by_intent:
                open_pr_aging_kwargs["median_open_pr_age_by_intent"] = (
                    aging_result.median_open_pr_age_by_intent
                )
            if aging_result.stale_open_pr_pct_by_origin:
                open_pr_aging_kwargs["stale_open_pr_pct_by_origin"] = (
                    aging_result.stale_open_pr_pct_by_origin
                )

    # Flow Load — WIP per ISO week (PRs in flight + author concurrency)
    flow_load_kwargs: dict = {}
    flow_load_result = analyze_flow_load(prs or [], commits)
    if flow_load_result:
        flow_load_kwargs["flow_load"] = [
            {
                "bucket": b.bucket,
                "bucket_start": b.bucket_start.isoformat(),
                "bucket_end": b.bucket_end.isoformat(),
                "wip_total": b.wip_total,
                "wip_by_intent": b.wip_by_intent,
                "author_concurrency": b.author_concurrency,
            }
            for b in flow_load_result.buckets
        ]

    # PR lifecycle (optional — only over merged PRs)
    pr_kwargs: dict = {}
    if prs:
        pr_result = analyze_pr_lifecycle(prs)
        if pr_result is not None:
            pr_kwargs = {
                "pr_merged_count": pr_result.pr_merged_count,
                "pr_median_time_to_merge_hours": pr_result.pr_median_time_to_merge_hours,
                "pr_mean_time_to_merge_hours": pr_result.pr_mean_time_to_merge_hours,
                "pr_p90_time_to_merge_hours": pr_result.pr_p90_time_to_merge_hours,
                "pr_pct_merged_within_24h": pr_result.pr_pct_merged_within_24h,
                "pr_cycle_time_buckets": {
                    "same_day": pr_result.pr_cycle_time_buckets.same_day,
                    "one_day": pr_result.pr_cycle_time_buckets.one_day,
                    "two_to_three_days": pr_result.pr_cycle_time_buckets.two_to_three_days,
                    "four_to_seven_days": pr_result.pr_cycle_time_buckets.four_to_seven_days,
                    "seven_plus_days": pr_result.pr_cycle_time_buckets.seven_plus_days,
                },
                "pr_median_size_files": pr_result.pr_median_size_files,
                "pr_median_size_lines": pr_result.pr_median_size_lines,
                "pr_review_rounds_median": pr_result.pr_review_rounds_median,
                "pr_single_pass_rate": pr_result.pr_single_pass_rate,
            }

    # Fix targeting — which origin's code attracts the most bug fixes
    fix_target_kwargs: dict = {}
    fix_target_result = calculate_fix_targeting(commits, origin_map, tool_map)
    if fix_target_result:
        if fix_target_result.by_origin:
            fix_target_kwargs["fix_target_by_origin"] = {
                bo.origin: {
                    "fixes_attracted": bo.fixes_attracted,
                    "code_share_pct": bo.code_share_pct,
                    "fix_share_pct": bo.fix_share_pct,
                    "disproportionality": bo.disproportionality,
                }
                for bo in fix_target_result.by_origin
            }
        if fix_target_result.by_tool:
            fix_target_kwargs["fix_target_by_tool"] = {
                bt.tool: {
                    "fixes_attracted": bt.fixes_attracted,
                }
                for bt in fix_target_result.by_tool
            }

    # Revert attribution
    revert_kwargs: dict = {}
    if revert_result.by_origin:
        revert_kwargs["revert_by_origin"] = {
            bo.origin: {
                "reverts": bo.reverts,
                "revert_rate": bo.revert_rate,
            }
            for bo in revert_result.by_origin
        }
    if revert_result.by_tool:
        revert_kwargs["revert_by_tool"] = {
            bt.tool: {
                "reverts": bt.reverts,
            }
            for bt in revert_result.by_tool
        }

    return ReportMetrics(
        commits_total=revert_result.commits_total,
        commits_revert=revert_result.commits_revert,
        revert_rate=revert_result.revert_rate,
        churn_events=churn_result.churn_events,
        churn_lines_affected=churn_result.churn_lines_affected,
        files_touched=stab_result.files_touched,
        files_stabilized=stab_result.files_stabilized,
        stabilization_ratio=stab_result.stabilization_ratio,
        commit_intent_distribution=dist.counts,
        churn_by_intent=churn_by_dict,
        stabilization_by_intent=stab_by_dict,
        lines_changed_by_intent=dist.lines_changed,
        **origin_kwargs,
        **shape_kwargs,
        **latency_kwargs,
        **cascade_kwargs,
        **attrib_kwargs,
        **churn_detail_kwargs,
        **stability_kwargs,
        **fix_target_kwargs,
        **revert_kwargs,
        **acceptance_kwargs,
        **timeline_kwargs,
        **pr_kwargs,
        **flow_load_kwargs,
        **flow_efficiency_kwargs,
        **human_review_coverage_kwargs,
        **open_pr_aging_kwargs,
        **_dora_real_kwargs(external_data, origin_map),
    )


def _dora_real_kwargs(
    external_data: ExternalDORAData | None,
    origin_map: dict[str, str] | None,
) -> dict:
    if external_data is None:
        return {}
    result = analyze_dora_real(external_data, origin_map=origin_map)
    return {
        "dora_source": result.source,
        "dora_deployments_total": result.deployments_total,
        "dora_deployments_failed": result.deployments_failed,
        "dora_deployments_pending_evaluation": result.deployments_pending_evaluation,
        "dora_incidents_total": result.incidents_total,
        "dora_cfr": result.cfr,
        "dora_mttr_per_deploy_seconds_median": result.mttr_per_deploy_seconds_median,
        "dora_mttr_per_deploy_seconds_p90": result.mttr_per_deploy_seconds_p90,
        "dora_mttr_per_incident_seconds_median": result.mttr_per_incident_seconds_median,
        "dora_mttr_per_incident_seconds_p90": result.mttr_per_incident_seconds_p90,
        "dora_rollback_rate": result.rollback_rate,
        "dora_rollbacks_total": result.rollbacks_total,
        "dora_lead_time_seconds_median": result.lead_time_seconds_median,
        "dora_deploy_frequency_per_day": result.deploy_frequency_per_day,
        "dora_remediation_distribution": result.remediation_distribution or None,
        "dora_cfr_by_origin": result.cfr_by_origin,
        "dora_rollback_rate_by_origin": result.rollback_rate_by_origin,
        "dora_cfr_by_origin_coverage_pct": result.cfr_by_origin_coverage_pct,
    }
