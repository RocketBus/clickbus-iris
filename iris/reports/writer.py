"""Output writer — generates report.md and metrics.json."""

import json
import os

from iris.analysis.activity_timeline import WeekActivity, render_delivery_pulse
from iris.analysis.origin_funnel import calculate_origin_funnel
from iris.analysis.priming_detector import PrimingResult
from iris.i18n import get_strings
from iris.models.adoption import AdoptionResult
from iris.models.context import AnalysisContext
from iris.models.metrics import ReportMetrics
from iris.models.trend import TrendResult
from iris.models.velocity import VelocityResult


def _file_prefix(ctx: AnalysisContext) -> str:
    """Build the org-repo prefix for output filenames."""
    if ctx.org_name:
        return f"{ctx.org_name}-{ctx.repo_name}"
    return ctx.repo_name


def write_metrics_json(
    ctx: AnalysisContext,
    metrics: ReportMetrics,
    out_dir: str,
    adoption: AdoptionResult | None = None,
    velocity: VelocityResult | None = None,
    priming: PrimingResult | None = None,
    author_velocity: "AuthorVelocityResult | None" = None,
) -> str:
    """Write metrics.json to out_dir. Returns the file path."""
    data = metrics.to_dict()

    if velocity is not None:
        data["velocity"] = {
            "commits_per_week": velocity.overall_commits_per_week,
            "lines_per_week": velocity.overall_lines_per_week,
            "trend": velocity.velocity_trend,
            "trend_change_pct": velocity.velocity_change_pct,
            "durability_correlation": velocity.correlation_direction,
            "windows": [
                {
                    "start": p.window_start.strftime("%Y-%m-%d"),
                    "end": p.window_end.strftime("%Y-%m-%d"),
                    "commits_per_week": p.commits_per_week,
                    "stabilization_ratio": p.stabilization_ratio,
                    "churn_rate": p.churn_rate,
                }
                for p in velocity.correlation_points
            ],
        }

    if author_velocity is not None:
        data["author_velocity"] = author_velocity.to_dict()

    funnel_result = calculate_origin_funnel(metrics)
    if funnel_result:
        data["origin_funnel"] = {
            f.origin: {
                "stages": [
                    {
                        "stage": st.stage,
                        "count": st.count,
                        "conversion": st.conversion_from_previous,
                    }
                    for st in f.stages
                ],
                "overall_conversion": f.overall_conversion,
            }
            for f in funnel_result.funnels
        }

    if priming is not None and priming.has_priming:
        data["priming"] = {
            "has_priming": True,
            "files": [
                {
                    "path": f.path,
                    "introduced_date": f.introduced_date.strftime("%Y-%m-%d") if f.introduced_date else None,
                    "size_bytes": f.size_bytes,
                }
                for f in priming.files
            ],
            "earliest_introduction": priming.earliest_introduction.strftime("%Y-%m-%d") if priming.earliest_introduction else None,
        }

    if adoption is not None:
        event = adoption.event
        data["adoption_timeline"] = {
            "first_ai_commit_date": event.first_ai_commit_date.strftime("%Y-%m-%d"),
            "adoption_ramp_start": event.adoption_ramp_start.strftime("%Y-%m-%d"),
            "adoption_ramp_end": event.adoption_ramp_end.strftime("%Y-%m-%d") if event.adoption_ramp_end else None,
            "adoption_confidence": event.adoption_confidence,
            "total_ai_commits": event.total_ai_commits,
            "pre_adoption": adoption.pre_metrics.to_dict(),
            "post_adoption": adoption.post_metrics.to_dict(),
        }

    path = os.path.join(out_dir, f"{_file_prefix(ctx)}-metrics.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")
    return path


def _render_delta_table(deltas, s: dict) -> list[str]:
    """Render a trend-style delta table from a list of MetricDelta objects."""
    lines = [
        f"| {s['table_metric']} | {s.get('table_pre_adoption', s.get('table_baseline', 'Baseline'))} | {s.get('table_post_adoption', s.get('table_recent', 'Recent'))} | {s['table_delta']} | {s['table_signal']} |",
        f"|---|---|---|---|---|",
    ]
    for d in deltas:
        if d.unit == "h":
            b_str = f"{d.baseline_value:.1f}h"
            r_str = f"{d.recent_value:.1f}h"
            d_str = f"{d.delta:+.1f}h"
        elif d.unit == "pp":
            b_str = f"{d.baseline_value:.1f}%"
            r_str = f"{d.recent_value:.1f}%"
            d_str = f"{d.delta:+.1f}pp"
        else:
            b_str = f"{d.baseline_value:.1f}"
            r_str = f"{d.recent_value:.1f}"
            d_str = f"{d.delta:+.1f}"

        if d.classification == "stable":
            signal = s["trend_signal_stable"]
        elif d.delta >= 0:
            signal = s[f"trend_signal_{d.classification}_up"]
        else:
            signal = s[f"trend_signal_{d.classification}_down"]

        lines.append(f"| {d.label} | {b_str} | {r_str} | {d_str} | {signal} |")
    return lines


def write_report_md(
    ctx: AnalysisContext,
    metrics: ReportMetrics,
    out_dir: str,
    narrative_sections: str = "",
    trend: TrendResult | None = None,
    adoption: AdoptionResult | None = None,
    velocity: VelocityResult | None = None,
    priming: PrimingResult | None = None,
) -> str:
    """Write report.md to out_dir. Returns the file path.

    narrative_sections is injected by the narrative module (M3).
    trend is optionally injected when --trend is used.
    adoption is optionally injected when AI adoption is detected.
    velocity is optionally injected when enough commits exist.
    """
    s = get_strings(ctx.lang)

    lines = [
        f"# {s['report_title']}",
        f"",
        f"**{s['label_repository']}:** {ctx.repo_name}",
        f"**{s['label_analysis_window']}:** {ctx.days} {s['unit_days']}",
        f"**{s['label_churn_window']}:** {ctx.churn_days} {s['unit_days']}",
        f"",
        f"> *{s['system_disclaimer']}*",
        f"",
        f"---",
        f"",
    ]

    if narrative_sections:
        lines.append(narrative_sections)
        lines.append("")
        lines.append("---")
        lines.append("")

    lines.extend([
        f"## {s['section_metrics_summary']}",
        f"",
        f"| {s['table_metric']} | {s['table_value']} |",
        f"|---|---|",
        f"| {s['metric_commits_total']} | {metrics.commits_total} |",
        f"| {s['metric_commits_revert']} | {metrics.commits_revert} |",
        f"| {s['metric_revert_rate']} | {metrics.revert_rate:.1%} |",
        f"| {s['metric_churn_events']} | {metrics.churn_events} |",
        f"| {s['metric_churn_lines_affected']} | {metrics.churn_lines_affected} |",
        f"| {s['metric_files_touched']} | {metrics.files_touched} |",
        f"| {s['metric_files_stabilized']} | {metrics.files_stabilized} |",
        f"| {s['metric_stabilization_ratio']} | {metrics.stabilization_ratio:.1%} |",
        f"",
    ])

    # Engineering Behavior section (conditional — only when intent data available)
    if metrics.commit_intent_distribution is not None:
        dist = metrics.commit_intent_distribution
        total = sum(dist.values())
        lines_by = metrics.lines_changed_by_intent or {}
        intent_order = ["FEATURE", "FIX", "REFACTOR", "CONFIG", "UNKNOWN"]
        label_keys = {
            "FEATURE": "metric_intent_feature",
            "FIX": "metric_intent_fix",
            "REFACTOR": "metric_intent_refactor",
            "CONFIG": "metric_intent_config",
            "UNKNOWN": "metric_intent_unknown",
        }

        lines.extend([
            f"## {s['section_engineering_behavior']}",
            f"",
            f"| {s['table_intent']} | {s['table_commits']} | {s['table_percentage']} | {s['table_lines_changed']} |",
            f"|---|---|---|---|",
        ])
        for intent in intent_order:
            count = dist.get(intent, 0)
            pct = f"{count / total:.0%}" if total > 0 else "0%"
            lc = f"{lines_by.get(intent, 0):,}"
            lines.append(
                f"| {s[label_keys[intent]]} | {count} | {pct} | {lc} |"
            )
        lines.append("")

    # Stability by Change Type section (conditional)
    if metrics.stabilization_by_intent is not None and metrics.churn_by_intent is not None:
        stab_by = metrics.stabilization_by_intent
        churn_by = metrics.churn_by_intent
        intent_order = ["FEATURE", "FIX", "REFACTOR", "CONFIG", "UNKNOWN"]
        label_keys = {
            "FEATURE": "metric_intent_feature",
            "FIX": "metric_intent_fix",
            "REFACTOR": "metric_intent_refactor",
            "CONFIG": "metric_intent_config",
            "UNKNOWN": "metric_intent_unknown",
        }

        lines.extend([
            f"## {s['section_stability_by_type']}",
            f"",
            f"| {s['table_intent']} | {s['table_files_touched']} | {s['table_stabilization']} | {s['table_churn_events']} |",
            f"|---|---|---|---|",
        ])
        for intent in intent_order:
            sb = stab_by.get(intent, {})
            ft = sb.get("files_touched", 0)
            if ft == 0:
                continue
            ratio = f"{sb.get('stabilization_ratio', 0):.0%}"
            ce = churn_by.get(intent, {}).get("churn_events", 0)
            lines.append(
                f"| {s[label_keys[intent]]} | {ft} | {ratio} | {ce} |"
            )
        lines.append("")

    # AI Detection Coverage caveat (always shown when coverage data exists)
    coverage_pct = metrics.ai_detection_coverage_pct
    if coverage_pct is not None:
        if coverage_pct == 0:
            coverage_msg = s["ai_coverage_none"]
        elif coverage_pct < 30:
            coverage_msg = s["ai_coverage_low"].format(pct=coverage_pct)
        else:
            coverage_msg = s["ai_coverage_high"].format(pct=coverage_pct)
    else:
        coverage_msg = None

    # AI Impact section (conditional — only when non-human commits exist)
    if metrics.stabilization_by_origin is not None:
        origin_dist = metrics.commit_origin_distribution or {}
        stab_by_origin = metrics.stabilization_by_origin
        churn_by_origin = metrics.churn_by_origin or {}
        origin_order = ["HUMAN", "AI_ASSISTED", "BOT"]
        origin_labels = {
            "HUMAN": "metric_origin_human",
            "AI_ASSISTED": "metric_origin_ai_assisted",
            "BOT": "metric_origin_bot",
        }

        lines.extend([
            f"## {s['section_ai_impact']}",
            f"",
        ])
        if coverage_msg:
            lines.extend([f"> {coverage_msg}", f""])
        lines.extend([
            f"| {s['table_origin']} | {s['table_commits']} | {s['table_files_touched']} | {s['table_stabilization']} | {s['table_churn_events']} |",
            f"|---|---|---|---|---|",
        ])
        for origin in origin_order:
            count = origin_dist.get(origin, 0)
            if count == 0:
                continue
            sb = stab_by_origin.get(origin, {})
            ft = sb.get("files_touched", 0)
            ratio = f"{sb.get('stabilization_ratio', 0):.0%}"
            ce = churn_by_origin.get(origin, {}).get("churn_events", 0)
            lines.append(
                f"| {s[origin_labels[origin]]} | {count} | {ft} | {ratio} | {ce} |"
            )
        lines.append("")

    # Commit Shape section (conditional — only when shape data exists)
    if metrics.commit_shape_dominant is not None:
        lines.extend([
            f"## {s['section_commit_shape']}",
            f"",
        ])

        if metrics.commit_shape_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
                "BOT": "metric_origin_bot",
                "ALL": "metric_commits_total",
            }
            lines.extend([
                f"| {s['table_origin']} | {s['shape_table_files']} | {s['shape_table_lines']} | {s['shape_table_spread']} | {s['shape_table_shape']} |",
                f"|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED", "BOT"]:
                entry = metrics.commit_shape_by_origin.get(origin)
                if not entry:
                    continue
                lines.append(
                    f"| {s[origin_labels[origin]]} | {entry['median_files_changed']:.0f} | {entry['median_lines_per_file']:.0f} | {entry['median_directory_spread']:.2f} | {entry['dominant_shape']} |"
                )
            lines.append("")
        else:
            # No per-origin breakdown, show overall only
            lines.append(f"> {s['shape_overall'].format(shape=metrics.commit_shape_dominant, files='—', lpf=0)}")
            lines.append("")

    # Fix Latency section (conditional — only when rework events exist)
    if metrics.fix_latency_median_hours is not None:
        median_days = metrics.fix_latency_median_hours / 24
        lines.extend([
            f"## {s['section_fix_latency']}",
            f"",
            f"> Median time to rework: {median_days:.1f} days.",
            f"",
        ])

        if metrics.fix_latency_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
                "BOT": "metric_origin_bot",
            }
            lines.extend([
                f"| {s['fix_latency_table_origin']} | {s['fix_latency_table_median']} | {s['fix_latency_table_fast_pct']} | {s['fix_latency_table_events']} |",
                f"|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED", "BOT"]:
                entry = metrics.fix_latency_by_origin.get(origin)
                if not entry:
                    continue
                med_days = entry["median_latency_hours"] / 24
                lines.append(
                    f"| {s[origin_labels[origin]]} | {med_days:.1f} days | {entry['fast_rework_pct']:.0f}% | {entry['rework_count']} |"
                )
            lines.append("")

    # Attribution Gap section (conditional — only when flagged commits exist)
    if metrics.attribution_gap:
        gap = metrics.attribution_gap
        lines.extend([
            f"## Attribution Gap",
            f"",
            f"{gap['flagged_commits']} commits ({gap['flagged_pct']:.0%}) match high-velocity patterns but have no AI attribution.",
        ])
        details = []
        if gap['avg_loc'] > 0:
            details.append(f"{gap['avg_loc']:.0f} avg LOC")
        if gap['avg_files'] > 0:
            details.append(f"{gap['avg_files']:.1f} avg files")
        if gap['avg_interval_minutes'] > 0:
            details.append(f"{gap['avg_interval_minutes']:.0f}min avg interval")
        if details:
            lines.append(f"These commits average {', '.join(details)}.")
        lines.extend([
            f"",
            f"This does not confirm AI usage — but the pattern is uncommon for manual development. Consider: `iris hook install`",
            f"",
        ])

    # Code Durability section (conditional — only when durability data exists)
    if metrics.durability_by_origin:
        lines.extend([
            f"## Code Durability — Line Survival",
            f"",
            f"> Lines introduced during this window that still exist at HEAD.",
            f"",
            f"| {s['table_origin']} | Lines Introduced | Lines Surviving | Survival Rate | Median Age |",
            f"|---|---|---|---|---|",
        ])
        origin_labels = {
            "HUMAN": "metric_origin_human",
            "AI_ASSISTED": "metric_origin_ai_assisted",
        }
        for origin in ["HUMAN", "AI_ASSISTED"]:
            entry = metrics.durability_by_origin.get(origin)
            if not entry:
                continue
            label = s.get(origin_labels.get(origin, ""), origin)
            lines.append(
                f"| {label} | {entry['lines_introduced']:,} | {entry['lines_surviving']:,} | {entry['survival_rate']:.0%} | {entry['median_age_days']:.0f} days |"
            )
        lines.append("")

        if metrics.durability_by_tool:
            lines.extend([
                f"| Tool | Lines Introduced | Lines Surviving | Survival Rate | Median Age |",
                f"|---|---|---|---|---|",
            ])
            for tool, entry in sorted(metrics.durability_by_tool.items()):
                lines.append(
                    f"| {tool} | {entry['lines_introduced']:,} | {entry['lines_surviving']:,} | {entry['survival_rate']:.0%} | {entry['median_age_days']:.0f} days |"
                )
            lines.append("")

    # Duplicate Code Detection section (conditional)
    if metrics.duplicate_block_rate is not None:
        lines.extend([
            f"## {s['section_duplicate_detection']}",
            f"",
            f"> {s['duplicate_summary'].format(rate=metrics.duplicate_block_rate, count=metrics.duplicate_block_count, median=metrics.duplicate_median_block_size)}",
            f"",
        ])
        if metrics.duplicate_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['duplicate_table_origin']} | {s['duplicate_table_commits']} | {s['duplicate_table_rate']} | {s['duplicate_table_blocks']} | {s['duplicate_table_median']} |",
                f"|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.duplicate_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['commits_analyzed']} | {entry['duplicate_rate']:.0%} | {entry['total_duplicate_blocks']} | {entry['median_block_size']:.0f} |"
                )
            lines.append("")

        if metrics.duplicate_by_tool:
            lines.extend([
                f"| Tool | {s['duplicate_table_commits']} | {s['duplicate_table_rate']} | {s['duplicate_table_blocks']} | {s['duplicate_table_median']} |",
                f"|---|---|---|---|---|",
            ])
            for tool, entry in sorted(metrics.duplicate_by_tool.items()):
                lines.append(
                    f"| {tool} | {entry['commits_analyzed']} | {entry['duplicate_rate']:.0%} | {entry['total_duplicate_blocks']} | {entry['median_block_size']:.0f} |"
                )
            lines.append("")

    # Code Movement & Refactoring Health section (conditional)
    if metrics.moved_code_pct is not None:
        lines.extend([
            f"## {s['section_moved_code']}",
            f"",
            f"> {s['moved_summary'].format(pct=metrics.moved_code_pct)}",
        ])
        if metrics.refactoring_ratio is not None:
            lines.append(f"> {s['moved_refactoring_ratio'].format(ratio=metrics.refactoring_ratio)}")
        lines.append("")

        if metrics.move_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['moved_table_origin']} | {s['moved_table_commits']} | {s['moved_table_with_moves']} | {s['moved_table_moved_lines']} | {s['moved_table_pct']} |",
                f"|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.move_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['commits_analyzed']} | {entry['commits_with_moves']} | {entry['moved_lines']:,} | {entry['moved_code_pct']:.1%} |"
                )
            lines.append("")

    # Code Provenance section (conditional)
    if metrics.revision_age_distribution is not None:
        lines.extend([
            f"## {s['section_code_provenance']}",
            f"",
        ])

        dist = metrics.revision_age_distribution
        bracket_keys = [
            ("under_2_weeks", "provenance_bracket_under_2w"),
            ("2_to_4_weeks", "provenance_bracket_2_to_4w"),
            ("1_to_12_months", "provenance_bracket_1_to_12m"),
            ("1_to_2_years", "provenance_bracket_1_to_2y"),
            ("over_2_years", "provenance_bracket_over_2y"),
        ]
        lines.extend([
            f"| {s['provenance_table_bracket']} | {s['provenance_table_pct']} |",
            f"|---|---|",
        ])
        for key, label_key in bracket_keys:
            pct = dist.get(key, 0)
            lines.append(f"| {s[label_key]} | {pct:.0%} |")
        lines.append("")

        if metrics.provenance_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['provenance_table_origin']} | {s['provenance_table_new_pct']} | {s['provenance_table_mature_pct']} | {s['provenance_table_median']} |",
                f"|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.provenance_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['pct_new_code']:.0%} | {entry['pct_mature_code']:.0%} | {entry['median_age_days']:.0f} days |"
                )
            lines.append("")

    # New Code Churn Rate section (conditional)
    if metrics.new_code_churn_rate_2w is not None:
        lines.extend([
            f"## {s['section_new_code_churn']}",
            f"",
            f"> {s['new_churn_summary'].format(rate_2w=metrics.new_code_churn_rate_2w, rate_4w=metrics.new_code_churn_rate_4w)}",
            f"",
        ])
        if metrics.new_code_churn_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['new_churn_table_origin']} | {s['new_churn_table_files']} | {s['new_churn_table_2w']} | {s['new_churn_table_rate_2w']} | {s['new_churn_table_4w']} | {s['new_churn_table_rate_4w']} |",
                f"|---|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.new_code_churn_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['files_with_new_code']} | {entry['files_churned_2w']} | {entry['churn_rate_2w']:.0%} | {entry['files_churned_4w']} | {entry['churn_rate_4w']:.0%} |"
                )
            lines.append("")

        if metrics.new_code_churn_by_tool:
            lines.extend([
                f"| Tool | {s['new_churn_table_files']} | {s['new_churn_table_2w']} | {s['new_churn_table_rate_2w']} | {s['new_churn_table_4w']} | {s['new_churn_table_rate_4w']} |",
                f"|---|---|---|---|---|---|",
            ])
            for tool, entry in sorted(metrics.new_code_churn_by_tool.items()):
                lines.append(
                    f"| {tool} | {entry['files_with_new_code']} | {entry['files_churned_2w']} | {entry['churn_rate_2w']:.0%} | {entry['files_churned_4w']} | {entry['churn_rate_4w']:.0%} |"
                )
            lines.append("")

    # Operation Mix section (conditional)
    if metrics.operation_distribution is not None:
        lines.extend([
            f"## {s['section_operation_mix']}",
            f"",
            f"> {s['operation_summary'].format(dominant=metrics.operation_dominant or 'unknown')}",
            f"",
        ])
        if metrics.operation_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['operation_table_origin']} | {s['operation_table_added']} | {s['operation_table_deleted']} | {s['operation_table_updated']} | {s['operation_table_moved']} | {s['operation_table_duplicated']} | {s['operation_table_dominant']} |",
                f"|---|---|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.operation_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['added']:.0%} | {entry['deleted']:.0%} | {entry['updated']:.0%} | {entry['moved']:.0%} | {entry['duplicated']:.0%} | {entry['dominant']} |"
                )
            lines.append("")

    # Correction Cascades section (conditional — only when cascade data exists)
    if metrics.cascade_rate is not None:
        total_triggers = 0
        total_cascades = 0
        if metrics.cascade_rate_by_origin:
            for entry in metrics.cascade_rate_by_origin.values():
                total_triggers += entry.get("total_commits", 0)
                total_cascades += entry.get("cascades", 0)

        lines.extend([
            f"## Correction Cascades",
            f"",
            f"> A correction cascade occurs when a commit is followed by one or more FIX commits touching the same files within 7 days.",
            f"",
            f"- Cascade rate: {metrics.cascade_rate:.0%} of commits triggered corrections",
            f"- Median cascade depth: {metrics.cascade_median_depth:.1f} fixes per cascade",
            f"",
        ])

        if metrics.cascade_rate_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['table_origin']} | {s['table_commits']} | Cascades | Rate | Median Depth |",
                f"|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.cascade_rate_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['total_commits']} | {entry['cascades']} | {entry['cascade_rate']:.0%} | {entry['median_depth']:.1f} |"
                )
            lines.append("")

        if metrics.cascade_rate_by_tool:
            lines.extend([
                f"| Tool | {s['table_commits']} | Cascades | Rate | Median Depth |",
                f"|---|---|---|---|---|",
            ])
            for tool, entry in sorted(metrics.cascade_rate_by_tool.items()):
                lines.append(
                    f"| {tool} | {entry['total_commits']} | {entry['cascades']} | {entry['cascade_rate']:.0%} | {entry['median_depth']:.1f} |"
                )
            lines.append("")

    # Revert Attribution section (conditional)
    if metrics.revert_by_origin:
        lines.extend([
            f"## Revert Attribution",
            f"",
            f"> Which origin's code gets reverted most often.",
            f"",
            f"| {s['table_origin']} | Reverts | Revert Rate |",
            f"|---|---|---|",
        ])
        origin_labels = {
            "HUMAN": "metric_origin_human",
            "AI_ASSISTED": "metric_origin_ai_assisted",
        }
        for origin in ["HUMAN", "AI_ASSISTED"]:
            entry = metrics.revert_by_origin.get(origin)
            if not entry:
                continue
            label = s.get(origin_labels.get(origin, ""), origin)
            lines.append(
                f"| {label} | {entry['reverts']} | {entry['revert_rate']:.1%} |"
            )
        lines.append("")

        if metrics.revert_by_tool:
            lines.extend([
                f"| Tool | Reverts |",
                f"|---|---|",
            ])
            for tool, entry in sorted(metrics.revert_by_tool.items()):
                lines.append(f"| {tool} | {entry['reverts']} |")
            lines.append("")

    # Fix Targeting section (conditional)
    if metrics.fix_target_by_origin:
        lines.extend([
            f"## Fix Targeting",
            f"",
            f"> Which origin's code attracts the most bug fixes. Disproportionality > 1.0 means overrepresented.",
            f"",
            f"| {s['table_origin']} | Code Share | Fix Share | Disproportionality |",
            f"|---|---|---|---|",
        ])
        origin_labels = {
            "HUMAN": "metric_origin_human",
            "AI_ASSISTED": "metric_origin_ai_assisted",
        }
        for origin in ["HUMAN", "AI_ASSISTED"]:
            entry = metrics.fix_target_by_origin.get(origin)
            if not entry:
                continue
            label = s.get(origin_labels.get(origin, ""), origin)
            lines.append(
                f"| {label} | {entry['code_share_pct']:.0%} | {entry['fix_share_pct']:.0%} | {entry['disproportionality']:.1f}x |"
            )
        lines.append("")

        if metrics.fix_target_by_tool:
            lines.extend([
                f"| Tool | Fixes Attracted |",
                f"|---|---|",
            ])
            for tool, entry in sorted(metrics.fix_target_by_tool.items()):
                lines.append(f"| {tool} | {entry['fixes_attracted']} |")
            lines.append("")

    # Churn Investigation section (conditional — only when churn detail exists)
    if metrics.churn_top_files:
        lines.extend([
            f"## Churn Investigation",
            f"",
            f"**Top churning files:**",
            f"",
            f"| File | Touches | Lines | Fixes | Chain | Span |",
            f"|---|---|---|---|---|---|",
        ])
        for f in metrics.churn_top_files:
            lines.append(
                f"| {f['file']} | {f['touches']} | {f['total_lines']:,} | {f['fix_count']} | {f['chain']} | {f['first_touch']}–{f['last_touch']} |"
            )
        lines.append("")

        if metrics.churn_couplings:
            lines.extend([
                f"**File coupling** (files that change together):",
                f"",
                f"| File A | File B | Co-occurrences | Coupling |",
                f"|---|---|---|---|",
            ])
            for c in metrics.churn_couplings:
                lines.append(
                    f"| {c['file_a']} | {c['file_b']} | {c['co_occurrences']} | {c['coupling_rate']:.0%} |"
                )
            lines.append("")

    # Stability Map section (conditional — only when stability_map data exists)
    if metrics.stability_map:
        lines.extend([
            f"## Stability Map",
            f"",
            f"| Directory | Files | Stabilized | Ratio | Churn |",
            f"|---|---|---|---|---|",
        ])
        for entry in metrics.stability_map:
            ratio_str = f"{entry['stabilization_ratio']:.0%}"
            lines.append(
                f"| {entry['directory']} | {entry['files_touched']} | {entry['files_stabilized']} | {ratio_str} | {entry['churn_events']} |"
            )
        lines.append("")

    # Knowledge Priming section (conditional — only when priming data exists)
    if priming is not None and priming.has_priming:
        lines.extend([
            f"## Knowledge Priming",
            f"",
            f"| File | Introduced | Size |",
            f"|---|---|---|",
        ])
        for pf in priming.files:
            date_str = pf.introduced_date.strftime("%Y-%m-%d") if pf.introduced_date else "unknown"
            size_str = f"{pf.size_bytes:,} bytes"
            lines.append(f"| {pf.path} | {date_str} | {size_str} |")
        lines.append("")

    # Acceptance Rate section (conditional — only when acceptance data exists)
    if metrics.acceptance_by_origin or metrics.acceptance_by_tool:
        lines.extend([
            f"## Code Review Acceptance Rate",
            f"",
            f"> Measures how commits survive the code review process, segmented by origin and AI tool.",
            f"",
        ])

        if metrics.acceptance_by_origin:
            origin_labels = {
                "HUMAN": "metric_origin_human",
                "AI_ASSISTED": "metric_origin_ai_assisted",
            }
            lines.extend([
                f"| {s['table_origin']} | {s['table_commits']} | In PRs | PR Rate | Single-Pass | Review Rounds |",
                f"|---|---|---|---|---|---|",
            ])
            for origin in ["HUMAN", "AI_ASSISTED"]:
                entry = metrics.acceptance_by_origin.get(origin)
                if not entry:
                    continue
                label = s.get(origin_labels.get(origin, ""), origin)
                lines.append(
                    f"| {label} | {entry['total_commits']} | {entry['commits_in_prs']} | {entry['pr_rate']:.0%} | {entry['single_pass_rate']:.0%} | {entry['median_review_rounds']:.1f} |"
                )
            lines.append("")

        if metrics.acceptance_by_tool:
            lines.extend([
                f"| Tool | {s['table_commits']} | In PRs | PR Rate | Single-Pass | Review Rounds |",
                f"|---|---|---|---|---|---|",
            ])
            for tool, entry in sorted(metrics.acceptance_by_tool.items()):
                lines.append(
                    f"| {tool} | {entry['total_commits']} | {entry['commits_in_prs']} | {entry['pr_rate']:.0%} | {entry['single_pass_rate']:.0%} | {entry['median_review_rounds']:.1f} |"
                )
            lines.append("")

    # Origin Funnel section (computed from existing metrics)
    funnel_result = calculate_origin_funnel(metrics)
    if funnel_result:
        origin_labels = {
            "HUMAN": s.get("metric_origin_human", "Human"),
            "AI_ASSISTED": s.get("metric_origin_ai_assisted", "AI-Assisted"),
        }
        lines.extend([
            f"## Origin Funnel",
            f"",
            f"> Tracks code from commit through review to survival, by origin.",
            f"",
        ])
        for funnel in funnel_result.funnels:
            label = origin_labels.get(funnel.origin, funnel.origin)
            lines.append(f"**{label}** (overall: {funnel.overall_conversion:.0%})")
            lines.append("")
            for stage in funnel.stages:
                if stage.conversion_from_previous is not None:
                    lines.append(f"- {stage.stage}: {stage.count:,} ({stage.conversion_from_previous:.0%})")
                else:
                    lines.append(f"- {stage.stage}: {stage.count:,}")
            lines.append("")

    # AI Adoption Impact section (conditional — only when adoption data exists)
    if adoption is not None:
        event = adoption.event
        lines.extend([
            f"## {s['section_adoption_impact']}",
            f"",
        ])

        # Header with adoption context
        if event.adoption_confidence == "clear":
            lines.append(f"> {s['adoption_header_clear'].format(date=event.first_ai_commit_date.strftime('%Y-%m-%d'), ramp_end=event.adoption_ramp_end.strftime('%Y-%m-%d'), ai_count=event.total_ai_commits)}")
        else:
            lines.append(f"> {s['adoption_header_sparse'].format(date=event.first_ai_commit_date.strftime('%Y-%m-%d'), ai_count=event.total_ai_commits)}")

        lines.extend([
            f">",
            f"> {s['adoption_pre_period'].format(commits=adoption.pre_metrics.commits_total, days=adoption.pre_days)}",
            f"> {s['adoption_post_period'].format(commits=adoption.post_metrics.commits_total, days=adoption.post_days)}",
            f"",
        ])

        # Delta table using the adoption comparison
        if adoption.comparison.has_sufficient_data and adoption.comparison.deltas:
            lines.extend(_render_delta_table(adoption.comparison.deltas, s))
            lines.append("")

    # PR Lifecycle section (conditional — only when PR data is available)
    if metrics.pr_merged_count is not None:
        pr_rows: list[str] = [
            f"## {s['section_pr_lifecycle']}",
            f"",
            f"| {s['table_metric']} | {s['table_value']} |",
            f"|---|---|",
            f"| {s['metric_pr_merged_count']} | {metrics.pr_merged_count} |",
            f"| {s['metric_pr_median_time_to_merge']} | {metrics.pr_median_time_to_merge_hours} |",
        ]
        if metrics.pr_mean_time_to_merge_hours is not None:
            pr_rows.append(
                f"| {s['metric_pr_mean_time_to_merge']} | {metrics.pr_mean_time_to_merge_hours} |"
            )
        if metrics.pr_p90_time_to_merge_hours is not None:
            pr_rows.append(
                f"| {s['metric_pr_p90_time_to_merge']} | {metrics.pr_p90_time_to_merge_hours} |"
            )
        if metrics.pr_pct_merged_within_24h is not None:
            pr_rows.append(
                f"| {s['metric_pr_pct_merged_within_24h']} | {metrics.pr_pct_merged_within_24h:.0%} |"
            )
        pr_rows.extend([
            f"| {s['metric_pr_median_size_files']} | {metrics.pr_median_size_files} |",
            f"| {s['metric_pr_median_size_lines']} | {metrics.pr_median_size_lines} |",
            f"| {s['metric_pr_review_rounds_median']} | {metrics.pr_review_rounds_median} |",
            f"| {s['metric_pr_single_pass_rate']} | {metrics.pr_single_pass_rate:.0%} |",
            f"",
        ])
        lines.extend(pr_rows)

    # Delivery Velocity section (conditional — only when enough commits)
    if velocity is not None:
        lines.extend([
            f"## {s['section_delivery_velocity']}",
            f"",
            f"> {s['velocity_overall'].format(cpw=velocity.overall_commits_per_week, lpw=velocity.overall_lines_per_week)}",
            f"> {s[f'velocity_trend_{velocity.velocity_trend}'].format(change=velocity.velocity_change_pct)}",
            f"> {s[f'velocity_correlation_{velocity.correlation_direction}']}",
            f"",
        ])

        # Per-window table
        if velocity.correlation_points:
            lines.extend([
                f"| Window | Commits/wk | Stabilization | Churn |",
                f"|---|---|---|---|",
            ])
            for p in velocity.correlation_points:
                w_label = p.window_start.strftime("%m/%d")
                lines.append(
                    f"| {w_label} | {p.commits_per_week:.1f} | {p.stabilization_ratio:.0%} | {p.churn_rate:.0%} |"
                )
            lines.append("")

        lines.append(f"*{s['velocity_correlation_caveat']}*")
        lines.append("")

    # Activity Timeline section (conditional — only when timeline data exists)
    if metrics.activity_timeline:
        lines.extend([
            f"## Activity Timeline",
            f"",
        ])

        # Delivery Pulse heatmap
        pulse_weeks = [
            WeekActivity(
                week_start=__import__("datetime").date.fromisoformat(w["week_start"]),
                week_end=__import__("datetime").date.fromisoformat(w["week_end"]),
                commits=w["commits"],
                lines_changed=w["lines_changed"],
                intent_distribution=w.get("intent", {}),
                origin_distribution=w.get("origin", {}),
                stabilization_ratio=w.get("stabilization_ratio"),
                churn_events=w.get("churn_events", 0),
                prs_merged=w.get("prs_merged"),
                pr_median_ttm_hours=w.get("pr_median_ttm_hours"),
            )
            for w in metrics.activity_timeline
        ]
        pulse_lines = render_delivery_pulse(pulse_weeks)
        if pulse_lines:
            lines.extend(pulse_lines)
            lines.append("")

        lines.extend([
            f"| Week | Commits | LOC | Feature | Fix | AI% | Stab. | Churn |",
            f"|---|---|---|---|---|---|---|---|",
        ])
        for w in metrics.activity_timeline:
            wk = w["week_start"][5:]  # MM-DD
            commits = w["commits"]
            loc = f"{w['lines_changed']:,}"
            # Intent percentages
            intent = w.get("intent", {})
            total_i = sum(intent.values()) or 1
            feat_pct = f"{intent.get('FEATURE', 0) / total_i:.0%}"
            fix_pct = f"{intent.get('FIX', 0) / total_i:.0%}"
            # AI percentage
            origin = w.get("origin", {})
            total_o = sum(v for k, v in origin.items() if k != "BOT") or 1
            ai_pct = f"{origin.get('AI_ASSISTED', 0) / total_o:.0%}"
            # Stabilization
            stab = f"{w['stabilization_ratio']:.0%}" if w.get("stabilization_ratio") is not None else "—"
            churn = w.get("churn_events", 0)
            lines.append(f"| {wk} | {commits} | {loc} | {feat_pct} | {fix_pct} | {ai_pct} | {stab} | {churn} |")
        lines.append("")

        if metrics.activity_patterns:
            for p in metrics.activity_patterns:
                lines.append(f"- **{p['pattern'].replace('_', ' ').title()}** ({p['week']}): {p['description']}")
            lines.append("")

    # Trend Analysis section (conditional — only when --trend is used)
    if trend is not None:
        from iris.analysis.trend_delta import generate_attention_summary
        from iris.reports.narrative import generate_trend_insufficient

        lines.extend([
            f"## {s['section_trend_analysis'].format(recent=trend.recent_days, baseline=trend.baseline_days)}",
            f"",
        ])

        # Attention summary — dominant pattern before the delta table
        if trend.has_sufficient_data:
            attention = generate_attention_summary(trend, lang=ctx.lang)
            if attention:
                lines.extend([f"> {attention}", f""])

        if trend.has_sufficient_data and trend.deltas:
            trend_s = dict(s)
            trend_s["table_pre_adoption"] = s["table_baseline"]
            trend_s["table_post_adoption"] = s["table_recent"]
            lines.extend(_render_delta_table(trend.deltas, trend_s))
            lines.append("")
        else:
            lines.append(generate_trend_insufficient(trend, lang=ctx.lang))
            lines.append("")

    lines.extend([
        f"---",
        f"",
        f"*{s['disclaimer']}*",
        f"",
    ])

    path = os.path.join(out_dir, f"{_file_prefix(ctx)}-report.md")
    with open(path, "w") as f:
        f.write("\n".join(lines))
    return path


def write_output(
    ctx: AnalysisContext,
    metrics: ReportMetrics,
    narrative_sections: str = "",
    trend: TrendResult | None = None,
    adoption: AdoptionResult | None = None,
    velocity: VelocityResult | None = None,
    priming: PrimingResult | None = None,
    author_velocity: "AuthorVelocityResult | None" = None,
) -> tuple[str, str]:
    """Write both output files. Creates out_dir if needed.

    Returns (report_path, metrics_path).
    """
    os.makedirs(ctx.out_dir, exist_ok=True)
    report_path = write_report_md(
        ctx, metrics, ctx.out_dir, narrative_sections,
        trend=trend, adoption=adoption, velocity=velocity,
        priming=priming,
    )
    metrics_path = write_metrics_json(
        ctx, metrics, ctx.out_dir,
        adoption=adoption, velocity=velocity, priming=priming,
        author_velocity=author_velocity,
    )
    return report_path, metrics_path
