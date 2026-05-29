"""Narrative generation — turns metrics into executive-readable explanations.

The narrative module generates two sections for the report:

1. Key Findings — 3-5 bullet points highlighting the most important signals.
2. Metric Explanations — plain-language description of each metric.

Tone: informative, not prescriptive. Provoke investigation, not judgment.

Thresholds used for insight selection are documented as hypotheses.
They are NOT validated benchmarks — they exist to make the report
useful and should be refined through experimentation.
"""

from iris.i18n import get_strings
from iris.models.metrics import ReportMetrics
from iris.models.trend import CoOccurrence, TrendResult

# --- Threshold hypotheses (v0) ---
# These are initial guesses. They should evolve based on real-world observation.
# A revert rate above this is flagged as potentially concerning.
REVERT_RATE_THRESHOLD = 0.05  # 5%
# A stabilization ratio below this is flagged as potentially concerning.
STABILIZATION_RATIO_THRESHOLD = 0.70  # 70%
# Churn events affecting more than this fraction of files is flagged.
CHURN_RATIO_THRESHOLD = 0.30  # 30%
# A single-pass rate above this is considered healthy review flow.
PR_SINGLE_PASS_THRESHOLD = 0.60  # 60%
# Fix commits above this fraction of total suggests corrective-dominant work.
FIX_DOMINANT_THRESHOLD = 0.40  # 40%
# Fix churn exceeding feature churn by this factor triggers insight.
FIX_CHURN_MULTIPLIER = 2.0  # 2x
# Stabilization gap between best and worst intent above this triggers insight.
STABILITY_GAP_THRESHOLD = 0.20  # 20 percentage points
# Flow Efficiency — below this fraction triggers the "wait dominates" finding.
# Hypothesis pending calibration with 3-5 repos.
FLOW_EFFICIENCY_LOW_THRESHOLD = 0.30
# Time-to-first-review (hours) above which we flag PRs as queued.
TIME_TO_FIRST_REVIEW_SLOW_HOURS = 24.0
# Human Review Coverage below this share triggers the "low coverage" finding.
# Hypothesis pending calibration with 3-5 repos.
HUMAN_REVIEW_COVERAGE_LOW_THRESHOLD = 0.50
# Gap (percentage points) between HUMAN and AI_ASSISTED PR coverage that
# triggers the origin-disparity finding.
HUMAN_REVIEW_COVERAGE_ORIGIN_GAP_THRESHOLD = 0.20
# Flow Load — feature WIP at the end of the window must exceed the start by
# this multiplier (and by an absolute floor) to trigger the growth finding.
# Threshold is a hypothesis pending calibration with 3-5 repos.
FLOW_LOAD_FEATURE_GROWTH_MULTIPLIER = 1.5
FLOW_LOAD_FEATURE_GROWTH_MIN_ABSOLUTE = 2
# Open PR Aging — fraction of open PRs stale (≥14d inactive) above this
# triggers the backlog-pressure finding. Hypothesis pending calibration.
OPEN_PR_STALE_PCT_THRESHOLD = 0.30
# Fraction of open PRs with ≥60d inactivity above this triggers the
# abandonment finding.
OPEN_PR_ABANDONMENT_PCT_THRESHOLD = 0.15
# Gap in stale_open_pr_pct between AI_ASSISTED and HUMAN origin (in
# percentage points) that triggers the AI-vs-human gap finding.
OPEN_PR_ORIGIN_GAP_PP = 0.20

# Maps ChangeIntent values to i18n interpretation keys
_INTENT_INTERPRETATION_KEYS = {
    "FEATURE": "intent_interpretation_feature",
    "FIX": "intent_interpretation_fix",
    "REFACTOR": "intent_interpretation_refactor",
    "CONFIG": "intent_interpretation_config",
    "UNKNOWN": "intent_interpretation_unknown",
}

_INTENT_LABEL_KEYS = {
    "FEATURE": "metric_intent_feature",
    "FIX": "metric_intent_fix",
    "REFACTOR": "metric_intent_refactor",
    "CONFIG": "metric_intent_config",
    "UNKNOWN": "metric_intent_unknown",
}

_INTENT_SYSTEMIC_KEYS = {
    "FEATURE": "systemic_intent_dominant_feature",
    "FIX": "systemic_intent_dominant_fix",
    "REFACTOR": "systemic_intent_dominant_refactor",
    "CONFIG": "systemic_intent_dominant_config",
    "UNKNOWN": "systemic_intent_dominant_unknown",
}


def generate_key_findings(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate the Key Findings section (3-5 bullet points).

    Selects the most relevant insights based on threshold heuristics.
    Always produces at least 3 findings even if everything looks healthy.
    """
    s = get_strings(lang)
    findings = []

    # Stabilization ratio
    if metrics.stabilization_ratio < STABILIZATION_RATIO_THRESHOLD:
        unstable_pct = (1 - metrics.stabilization_ratio) * 100
        finding = s["finding_stabilization_low"].format(
            ratio=f"{metrics.stabilization_ratio:.0%}",
            unstable_pct=f"{unstable_pct:.0f}%",
        )
        finding += " " + s["systemic_stabilization_low"]
        findings.append(finding)
    else:
        findings.append(s["finding_stabilization_high"].format(
            ratio=f"{metrics.stabilization_ratio:.0%}",
        ))

    # Revert rate
    if metrics.revert_rate > REVERT_RATE_THRESHOLD:
        finding = s["finding_revert_high"].format(
            rate=f"{metrics.revert_rate:.1%}",
            reverts=metrics.commits_revert,
            total=metrics.commits_total,
            threshold=f"{REVERT_RATE_THRESHOLD:.0%}",
        )
        finding += " " + s["systemic_revert_high"]
        findings.append(finding)
    else:
        findings.append(s["finding_revert_low"].format(
            rate=f"{metrics.revert_rate:.1%}",
            reverts=metrics.commits_revert,
            total=metrics.commits_total,
        ))

    # Churn ratio
    churn_ratio = (
        metrics.churn_events / metrics.files_touched
        if metrics.files_touched > 0
        else 0.0
    )
    if churn_ratio > CHURN_RATIO_THRESHOLD:
        finding = s["finding_churn_high"].format(
            events=metrics.churn_events,
            ratio=f"{churn_ratio:.0%}",
            lines=f"{metrics.churn_lines_affected:,}",
        )
        finding += " " + s["systemic_churn_high"]
        findings.append(finding)
    else:
        findings.append(s["finding_churn_low"].format(
            events=metrics.churn_events,
            ratio=f"{churn_ratio:.0%}",
            lines=f"{metrics.churn_lines_affected:,}",
        ))

    # Fix targeting disproportionality (AI code attracting more fixes)
    if metrics.fix_target_by_origin:
        ai_target = metrics.fix_target_by_origin.get("AI_ASSISTED")
        if ai_target and ai_target.get("disproportionality", 0) > 1.5:
            findings.append(
                f"AI-assisted code attracts {ai_target['disproportionality']:.1f}x more bug fixes "
                f"than its code share ({ai_target['code_share_pct']:.0%} of code, "
                f"{ai_target['fix_share_pct']:.0%} of fixes)"
            )

    # Revert attribution (AI code reverted more often)
    if metrics.revert_by_origin:
        ai_revert = metrics.revert_by_origin.get("AI_ASSISTED")
        human_revert = metrics.revert_by_origin.get("HUMAN")
        if (
            ai_revert and human_revert
            and human_revert.get("revert_rate", 0) > 0
            and ai_revert.get("revert_rate", 0) > human_revert["revert_rate"] * 2
        ):
            ratio = ai_revert["revert_rate"] / human_revert["revert_rate"]
            findings.append(
                f"AI-assisted code is reverted {ratio:.1f}x more often than human code "
                f"({ai_revert['reverts']} AI reverts vs {human_revert['reverts']} human)"
            )

    # Flow Efficiency — wait-dominant signal + time-to-first-review queueing
    findings.extend(_flow_efficiency_findings(metrics, s))

    # Human Review Coverage — real-human-review share + AI/human origin gap
    findings.extend(_human_review_coverage_findings(metrics, s))

    # Flow Load — descriptive WIP snapshot + optional feature-growth signal
    flow_findings = _flow_load_findings(metrics, s)
    findings.extend(flow_findings)

    # Open PR Aging — stuck-inventory pressure + abandonment + origin gap
    findings.extend(_open_pr_aging_findings(metrics, s))

    # DORA (real) — descriptive bullets when external integration delivers data
    findings.extend(_dora_real_findings(metrics, s))

    # Volume context
    findings.append(s["finding_volume"].format(
        commits=metrics.commits_total,
        files=metrics.files_touched,
    ))

    lines = [f"## {s['section_key_findings']}", ""]
    for f in findings:
        lines.append(f"- {f}")
    return "\n".join(lines)


def _flow_efficiency_findings(metrics: ReportMetrics, s: dict) -> list[str]:
    """Build Flow Efficiency findings (0-2 bullets).

    Descriptive bullet whenever ``flow_efficiency_median`` is present.
    Adds a queueing bullet if ``median_time_to_first_review_hours`` is
    above the slow threshold. The "wait dominates" variant replaces the
    descriptive bullet when efficiency is below the low threshold.
    """
    if metrics.flow_efficiency_median is None:
        return []

    pct = f"{metrics.flow_efficiency_median:.0%}"
    pr_count = 0
    # pr_count isn't on ReportMetrics; we surface only the percentage.
    # When the data is sparse, the by_intent dict tells the platform UI to
    # hide segments — that's enough caveat for the narrative.

    findings: list[str] = []
    if metrics.flow_efficiency_median < FLOW_EFFICIENCY_LOW_THRESHOLD:
        findings.append(s["finding_flow_efficiency_low"].format(pct=pct))
    else:
        findings.append(
            s["finding_flow_efficiency_descriptive"].format(pct=pct, pr_count=pr_count)
        )

    if (
        metrics.median_time_to_first_review_hours is not None
        and metrics.median_time_to_first_review_hours > TIME_TO_FIRST_REVIEW_SLOW_HOURS
    ):
        findings.append(
            s["finding_time_to_first_review_slow"].format(
                hours=metrics.median_time_to_first_review_hours,
            )
        )

    return findings


def _human_review_coverage_findings(metrics: ReportMetrics, s: dict) -> list[str]:
    """Build Human Review Coverage findings (0-2 bullets).

    A descriptive (or low-coverage) bullet whenever
    ``human_review_coverage_pct`` is present, plus an origin-gap bullet when
    AI-assisted PRs receive markedly less human review than human-authored PRs.
    """
    if metrics.human_review_coverage_pct is None:
        return []

    review_pct = f"{metrics.human_review_coverage_pct:.0%}"
    approval_pct = (
        f"{metrics.human_approval_coverage_pct:.0%}"
        if metrics.human_approval_coverage_pct is not None
        else review_pct
    )

    findings: list[str] = []
    if metrics.human_review_coverage_pct < HUMAN_REVIEW_COVERAGE_LOW_THRESHOLD:
        findings.append(
            s["finding_human_review_coverage_low"].format(
                review_pct=review_pct, approval_pct=approval_pct
            )
        )
    else:
        findings.append(
            s["finding_human_review_coverage_descriptive"].format(
                review_pct=review_pct, approval_pct=approval_pct
            )
        )

    by_origin = metrics.human_review_coverage_by_origin_of_pr or {}
    ai = by_origin.get("AI_ASSISTED")
    human = by_origin.get("HUMAN")
    if (
        ai is not None
        and human is not None
        and (human - ai) >= HUMAN_REVIEW_COVERAGE_ORIGIN_GAP_THRESHOLD
    ):
        gap_pp = round((human - ai) * 100)
        findings.append(
            s["finding_human_review_coverage_origin_gap"].format(
                gap=gap_pp,
                ai_pct=f"{ai:.0%}",
                human_pct=f"{human:.0%}",
            )
        )

    return findings


def _flow_load_findings(metrics: ReportMetrics, s: dict) -> list[str]:
    """Build Flow Load findings (0-2 bullets) from the flow_load series.

    Emits a descriptive snapshot whenever the series exists, plus a
    feature-growth bullet when the last bucket's FEATURE WIP exceeds the
    first bucket's by ``FLOW_LOAD_FEATURE_GROWTH_MULTIPLIER`` and at least
    ``FLOW_LOAD_FEATURE_GROWTH_MIN_ABSOLUTE``.
    """
    if not metrics.flow_load:
        return []

    from statistics import median

    series = metrics.flow_load
    wips = [b.get("wip_total", 0) for b in series]
    authors = [b.get("author_concurrency", 0) for b in series]
    if not any(wips):
        return []

    peak = max(series, key=lambda b: b.get("wip_total", 0))
    findings = [s["finding_flow_load_descriptive"].format(
        median_wip=int(median(wips)),
        peak_wip=peak.get("wip_total", 0),
        peak_week=peak.get("bucket", "?"),
        median_authors=int(median(authors)) if authors else 0,
    )]

    first = series[0].get("wip_by_intent", {}).get("FEATURE", 0)
    last = series[-1].get("wip_by_intent", {}).get("FEATURE", 0)
    if (
        last >= FLOW_LOAD_FEATURE_GROWTH_MIN_ABSOLUTE
        and first > 0
        and last >= first * FLOW_LOAD_FEATURE_GROWTH_MULTIPLIER
    ):
        findings.append(s["finding_flow_load_feature_growth"].format(
            start_wip=first,
            end_wip=last,
        ))
    return findings


def _open_pr_aging_findings(metrics: ReportMetrics, s: dict) -> list[str]:
    """Build Open PR Aging findings (0-3 bullets).

    - Descriptive bullet when ``open_pr_count`` is present.
    - Backlog-pressure bullet when ``stale_open_pr_pct`` crosses
      ``OPEN_PR_STALE_PCT_THRESHOLD``.
    - Abandonment bullet when ``abandonment_risk_pct`` crosses
      ``OPEN_PR_ABANDONMENT_PCT_THRESHOLD``.
    - AI-vs-human gap bullet when the by_origin spread crosses
      ``OPEN_PR_ORIGIN_GAP_PP``.
    """
    if metrics.open_pr_count is None or metrics.open_pr_count == 0:
        return []

    findings: list[str] = []
    findings.append(
        s["finding_open_pr_aging_descriptive"].format(
            count=metrics.open_pr_count,
            median_age=metrics.median_open_pr_age_days or 0.0,
        )
    )

    if (
        metrics.stale_open_pr_pct is not None
        and metrics.stale_open_pr_pct >= OPEN_PR_STALE_PCT_THRESHOLD
    ):
        findings.append(
            s["finding_open_pr_aging_stale"].format(
                pct=f"{metrics.stale_open_pr_pct:.0%}",
            )
        )

    if (
        metrics.abandonment_risk_pct is not None
        and metrics.abandonment_risk_pct >= OPEN_PR_ABANDONMENT_PCT_THRESHOLD
    ):
        findings.append(
            s["finding_open_pr_aging_abandonment"].format(
                pct=f"{metrics.abandonment_risk_pct:.0%}",
            )
        )

    by_origin = metrics.stale_open_pr_pct_by_origin or {}
    ai = by_origin.get("AI_ASSISTED")
    human = by_origin.get("HUMAN")
    if ai is not None and human is not None and (ai - human) >= OPEN_PR_ORIGIN_GAP_PP:
        findings.append(
            s["finding_open_pr_aging_origin_gap"].format(
                ai_pct=f"{ai:.0%}",
                human_pct=f"{human:.0%}",
            )
        )

    return findings


def _dora_real_findings(metrics: ReportMetrics, s: dict) -> list[str]:
    """Build DORA (real) findings (0-3 bullets) when external integration data is present.

    Always descriptive — no thresholds yet, since 30 days of data on a new
    integration isn't enough to calibrate "good" vs "bad" CFR/MTTR per
    repo. The dashboard handles the visual story; narrative just states
    the headline numbers so the report.md reader sees them.
    """
    if metrics.dora_source is None or metrics.dora_deployments_total is None:
        return []

    findings: list[str] = []

    if metrics.dora_cfr is not None:
        findings.append(
            s["finding_dora_cfr_descriptive"].format(
                cfr_pct=f"{metrics.dora_cfr:.0%}",
                failed=metrics.dora_deployments_failed or 0,
                evaluated=(
                    (metrics.dora_deployments_total or 0)
                    - (metrics.dora_deployments_pending_evaluation or 0)
                ),
            )
        )
    elif metrics.dora_deployments_pending_evaluation:
        findings.append(
            s["finding_dora_cfr_all_pending"].format(
                pending=metrics.dora_deployments_pending_evaluation,
            )
        )

    if metrics.dora_mttr_per_deploy_seconds_median is not None:
        findings.append(
            s["finding_dora_mttr_descriptive"].format(
                hours=metrics.dora_mttr_per_deploy_seconds_median / 3600.0,
                failed=metrics.dora_deployments_failed or 0,
            )
        )

    if metrics.dora_rollback_rate is not None and metrics.dora_rollback_rate > 0:
        findings.append(
            s["finding_dora_rollback_rate"].format(
                pct=f"{metrics.dora_rollback_rate:.0%}",
                rollbacks=metrics.dora_rollbacks_total or 0,
            )
        )

    return findings


def generate_pr_findings(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate PR-specific findings (1-2 bullet points).

    Only called when PR data is available (pr_merged_count is not None).
    """
    s = get_strings(lang)
    findings = []

    findings.append(s["finding_pr_volume"].format(
        count=metrics.pr_merged_count,
        hours=metrics.pr_median_time_to_merge_hours,
    ))

    if metrics.pr_single_pass_rate >= PR_SINGLE_PASS_THRESHOLD:
        findings.append(s["finding_pr_single_pass_high"].format(
            rate=f"{metrics.pr_single_pass_rate:.0%}",
        ))
    else:
        finding = s["finding_pr_single_pass_low"].format(
            rate=f"{metrics.pr_single_pass_rate:.0%}",
        )
        finding += " " + s["systemic_pr_single_pass_low"]
        findings.append(finding)

    return "\n".join(f"- {f}" for f in findings)


def generate_pr_explanations(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate plain-language explanations for PR metrics.

    Only called when PR data is available (pr_merged_count is not None).
    """
    s = get_strings(lang)
    sections = []

    sections.append(_explain(
        s["explain_pr_time_to_merge_title"],
        f"{metrics.pr_median_time_to_merge_hours}h",
        s["explain_pr_time_to_merge_body"].format(
            hours=metrics.pr_median_time_to_merge_hours,
            count=metrics.pr_merged_count,
        ),
    ))

    sections.append(_explain(
        s["explain_pr_single_pass_title"],
        f"{metrics.pr_single_pass_rate:.0%}",
        s["explain_pr_single_pass_body"].format(
            rate=f"{metrics.pr_single_pass_rate:.0%}",
            rounds=metrics.pr_review_rounds_median,
        ),
    ))

    return "\n\n".join(sections)


def generate_intent_findings(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate intent-specific findings (2-3 bullet points).

    Only called when intent data is available (commit_intent_distribution is not None).
    """
    s = get_strings(lang)
    findings = []
    dist = metrics.commit_intent_distribution
    total = sum(dist.values())

    if total == 0:
        return ""

    # 1. Dominant intent
    dominant = max(dist, key=dist.get)
    dominant_pct = dist[dominant] / total
    finding = s["finding_intent_dominant"].format(
        intent=s[_INTENT_LABEL_KEYS[dominant]],
        pct=f"{dominant_pct:.0%}",
        interpretation=s[_INTENT_INTERPRETATION_KEYS[dominant]],
    )
    finding += " " + s[_INTENT_SYSTEMIC_KEYS[dominant]]
    findings.append(finding)

    # 2. Fix churn vs Feature churn comparison
    churn_by = metrics.churn_by_intent or {}
    fix_churn = churn_by.get("FIX", {}).get("churn_events", 0)
    feat_churn = churn_by.get("FEATURE", {}).get("churn_events", 0)

    if fix_churn > 0 and feat_churn > 0 and fix_churn >= feat_churn * FIX_CHURN_MULTIPLIER:
        finding = s["finding_intent_fix_churn_high"].format(
            fix_churn=fix_churn,
            comparison=f"{fix_churn / feat_churn:.1f}x",
            feat_churn=feat_churn,
        )
        finding += " " + s["systemic_intent_fix_churn_high"]
        findings.append(finding)
    else:
        findings.append(s["finding_intent_fix_churn_low"].format(
            fix_churn=fix_churn,
            feat_churn=feat_churn,
        ))

    # 3. Stabilization gap (only for intents with commits)
    stab_by = metrics.stabilization_by_intent or {}
    active = {
        k: v["stabilization_ratio"]
        for k, v in stab_by.items()
        if v.get("files_touched", 0) > 0
    }
    if len(active) >= 2:
        best_k = max(active, key=active.get)
        worst_k = min(active, key=active.get)
        gap = active[best_k] - active[worst_k]
        if gap >= STABILITY_GAP_THRESHOLD:
            finding = s["finding_intent_stabilization_gap"].format(
                best=s[_INTENT_LABEL_KEYS[best_k]],
                best_ratio=f"{active[best_k]:.0%}",
                worst=s[_INTENT_LABEL_KEYS[worst_k]],
                worst_ratio=f"{active[worst_k]:.0%}",
            )
            finding += " " + s["systemic_intent_stabilization_gap"]
            findings.append(finding)

    return "\n".join(f"- {f}" for f in findings)


def generate_intent_explanations(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate plain-language explanations for intent metrics.

    Only called when intent data is available (commit_intent_distribution is not None).
    """
    s = get_strings(lang)
    sections = []
    dist = metrics.commit_intent_distribution

    sections.append(_explain(
        s["explain_intent_distribution_title"],
        f"{sum(dist.values())} commits",
        s["explain_intent_distribution_body"].format(
            feature=dist.get("FEATURE", 0),
            fix=dist.get("FIX", 0),
            refactor=dist.get("REFACTOR", 0),
            config=dist.get("CONFIG", 0),
            unknown=dist.get("UNKNOWN", 0),
        ),
    ))

    stab_by = metrics.stabilization_by_intent or {}
    sections.append(_explain(
        s["explain_intent_stability_title"],
        "",
        s["explain_intent_stability_body"].format(
            feat_ratio=f"{stab_by.get('FEATURE', {}).get('stabilization_ratio', 0):.0%}",
            fix_ratio=f"{stab_by.get('FIX', {}).get('stabilization_ratio', 0):.0%}",
            refactor_ratio=f"{stab_by.get('REFACTOR', {}).get('stabilization_ratio', 0):.0%}",
        ),
    ))

    return "\n\n".join(sections)


def generate_metric_explanations(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate plain-language explanations for each metric."""
    s = get_strings(lang)
    sections = []

    sections.append(_explain(
        s["explain_revert_rate_title"],
        f"{metrics.revert_rate:.1%}",
        s["explain_revert_rate_body"].format(
            reverts=metrics.commits_revert,
            total=metrics.commits_total,
        ),
    ))

    sections.append(_explain(
        s["explain_churn_events_title"],
        str(metrics.churn_events),
        s["explain_churn_events_body"].format(
            events=metrics.churn_events,
            lines=f"{metrics.churn_lines_affected:,}",
        ),
    ))

    sections.append(_explain(
        s["explain_stabilization_title"],
        f"{metrics.stabilization_ratio:.1%}",
        s["explain_stabilization_body"].format(
            stabilized=metrics.files_stabilized,
            touched=metrics.files_touched,
        ),
    ))

    return "\n\n".join(sections)


def _explain(title: str, value: str, explanation: str) -> str:
    """Format a single metric explanation block."""
    return f"### {title}: {value}\n\n{explanation}"


# Maps trend delta metric names to (positive_key, negative_key) finding templates.
# "positive" = delta > 0, "negative" = delta < 0.
# For metrics where UP is bad (churn, revert), the keys reflect that.
_TREND_FINDING_KEYS: dict[str, tuple[str, str]] = {
    "stabilization_ratio": ("trend_finding_stabilization_up", "trend_finding_stabilization_down"),
    "churn_rate": ("trend_finding_churn_up", "trend_finding_churn_down"),
    "revert_rate": ("trend_finding_revert_up", None),
    "pr_time_to_merge": ("trend_finding_pr_ttm_up", "trend_finding_pr_ttm_down"),
    "pr_single_pass": ("trend_finding_pr_spr_up", "trend_finding_pr_spr_down"),
}

# Maximum trend findings to include in the narrative.
MAX_TREND_FINDINGS = 4


def _build_co_occurrence_kwargs(trend: TrendResult, co: CoOccurrence) -> dict[str, str]:
    """Build format kwargs for a co-occurrence template from its involved metrics."""
    from iris.analysis.trend_delta import _get_delta

    kwargs: dict[str, str] = {}
    for metric in co.metrics:
        d = _get_delta(trend, metric)
        if d is None:
            continue
        if metric == "stabilization_ratio":
            kwargs["stab_delta"] = f"{d.delta:+.0f}"
        elif metric == "churn_rate":
            kwargs["churn_delta"] = f"{d.delta:+.0f}"
        elif metric == "feature_stabilization":
            kwargs["feature_stab_delta"] = f"{d.delta:+.0f}"
        elif metric == "fix_stabilization":
            kwargs["fix_stab_delta"] = f"{d.delta:+.0f}"
        elif metric == "pr_time_to_merge":
            kwargs["ttm_delta"] = f"{d.delta:+.1f}"
        elif metric == "pr_single_pass":
            kwargs["spr_delta"] = f"{d.delta:+.0f}"
    return kwargs


def _generate_individual_finding(d, trend: TrendResult, s: dict[str, str]) -> str | None:
    """Generate a single trend finding for a metric delta. Returns None if no template."""
    keys = _TREND_FINDING_KEYS.get(d.metric)

    # Intent share shifts use a generic template
    if d.metric.endswith("_share"):
        direction = "up" if d.delta > 0 else "down"
        return s["trend_finding_intent_shift"].format(
            intent=d.label,
            delta=f"{abs(d.delta):.0f}",
            direction=direction,
        )

    # Stabilization by intent uses the same stabilization template
    if d.metric.endswith("_stabilization"):
        key = "trend_finding_stabilization_up" if d.delta >= 0 else "trend_finding_stabilization_down"
        finding = s[key].format(
            delta=f"{abs(d.delta):.0f}",
            recent=trend.recent_days,
            baseline=trend.baseline_days,
        )
        return f"{d.label}: {finding}"

    if not keys:
        return None

    pos_key, neg_key = keys
    key = pos_key if d.delta >= 0 else neg_key

    if key is None:
        return None

    return s[key].format(
        delta=f"{abs(d.delta):.0f}",
        recent=trend.recent_days,
        baseline=trend.baseline_days,
    )


def generate_trend_findings(trend: TrendResult, lang: str = "en") -> str:
    """Generate trend-specific findings (2-4 bullet points).

    Includes co-occurrence patterns (connected findings) first, then individual
    notable/significant deltas for metrics not already covered by co-occurrences.
    Returns empty string when trend has insufficient data or no notable changes.
    """
    if not trend.has_sufficient_data:
        return ""

    from iris.analysis.trend_delta import detect_co_occurrences

    s = get_strings(lang)

    # Co-occurrence patterns first — they consume their metrics
    co_occurrences = detect_co_occurrences(trend)
    consumed_metrics: set[str] = set()
    findings: list[str] = []

    for co in co_occurrences:
        consumed_metrics.update(co.metrics)
        kwargs = _build_co_occurrence_kwargs(trend, co)
        findings.append(s[co.summary_key].format(**kwargs))

    # Individual findings for non-consumed notable/significant metrics
    noteworthy = [
        d for d in trend.deltas
        if d.classification != "stable" and d.metric not in consumed_metrics
    ]
    noteworthy.sort(key=lambda d: abs(d.delta), reverse=True)

    remaining_slots = MAX_TREND_FINDINGS - len(findings)
    for d in noteworthy[:remaining_slots]:
        finding = _generate_individual_finding(d, trend, s)
        if finding:
            findings.append(finding)

    if not findings:
        return ""

    return "\n".join(f"- {f}" for f in findings)


def generate_trend_insufficient(trend: TrendResult, lang: str = "en") -> str:
    """Generate a message when trend data is insufficient."""
    s = get_strings(lang)
    return s["trend_insufficient_data"].format(
        recent=trend.recent_days,
        count=trend.recent_commits,
    )


def generate_narrative(metrics: ReportMetrics, lang: str = "en", trend: TrendResult | None = None) -> str:
    """Generate the complete narrative section for the report.

    Combines Key Findings, PR Findings (if available), and Metric Explanations.
    """
    s = get_strings(lang)

    key_findings = generate_key_findings(metrics, lang=lang)

    # Append intent findings if classification data is available
    if metrics.commit_intent_distribution is not None:
        intent_findings = generate_intent_findings(metrics, lang=lang)
        if intent_findings:
            key_findings += "\n" + intent_findings

    # Append PR findings if PR data is available
    if metrics.pr_merged_count is not None:
        key_findings += "\n" + generate_pr_findings(metrics, lang=lang)

    # Append code quality findings
    quality_findings = generate_quality_findings(metrics, lang=lang)
    if quality_findings:
        key_findings += "\n" + quality_findings

    # Append trend findings if trend data is available
    if trend is not None and trend.has_sufficient_data:
        trend_findings = generate_trend_findings(trend, lang=lang)
        if trend_findings:
            key_findings += "\n" + trend_findings

    explanations = generate_metric_explanations(metrics, lang=lang)

    # Append intent explanations if classification data is available
    if metrics.commit_intent_distribution is not None:
        explanations += "\n\n" + generate_intent_explanations(metrics, lang=lang)

    # Append PR explanations if PR data is available
    if metrics.pr_merged_count is not None:
        explanations += "\n\n" + generate_pr_explanations(metrics, lang=lang)

    parts = [
        key_findings,
        "",
        "---",
        "",
        f"## {s['section_metric_details']}",
        "",
        explanations,
    ]
    return "\n".join(parts)


# --- Code Quality threshold hypotheses ---
DUPLICATE_RATE_THRESHOLD = 0.05       # 5% of commits with duplicates
MOVED_CODE_PCT_LOW = 0.05            # below 5% moved suggests low refactoring
REFACTORING_RATIO_LOW = 0.30         # below 30% moved/(moved+dup)
NEW_CODE_CHURN_2W_THRESHOLD = 0.15   # 15% of new files churned in 2w
REVISING_NEW_CODE_THRESHOLD = 0.75   # 75% revisions on code < 1 month


def generate_quality_findings(metrics: ReportMetrics, lang: str = "en") -> str:
    """Generate findings for code quality metrics (duplicates, moves, provenance, churn)."""
    s = get_strings(lang)
    findings: list[str] = []

    # Duplicate block findings
    if metrics.duplicate_block_rate is not None:
        rate_str = f"{metrics.duplicate_block_rate:.0%}"
        if metrics.duplicate_block_rate >= DUPLICATE_RATE_THRESHOLD:
            finding = s["finding_duplicate_high"].format(
                rate=rate_str, count=metrics.duplicate_block_count,
            )
            finding += " " + s["systemic_duplicate_high"]
            findings.append(f"- {finding}")
        else:
            findings.append(f"- {s['finding_duplicate_low'].format(rate=rate_str)}")

    # Moved code / refactoring findings
    if metrics.moved_code_pct is not None:
        pct_str = f"{metrics.moved_code_pct:.1%}"
        if metrics.moved_code_pct < MOVED_CODE_PCT_LOW:
            finding = s["finding_moved_low"].format(pct=pct_str)
            finding += " " + s["systemic_moved_low"]
            findings.append(f"- {finding}")
        else:
            findings.append(f"- {s['finding_moved_healthy'].format(pct=pct_str)}")

        if metrics.refactoring_ratio is not None and metrics.refactoring_ratio < REFACTORING_RATIO_LOW:
            findings.append(
                f"- {s['finding_refactoring_ratio_low'].format(ratio=f'{metrics.refactoring_ratio:.0%}')}"
            )

    # Code provenance findings
    if metrics.pct_revising_new_code is not None:
        pct_str = f"{metrics.pct_revising_new_code:.0%}"
        if metrics.pct_revising_new_code >= REVISING_NEW_CODE_THRESHOLD:
            finding = s["finding_provenance_new_heavy"].format(pct=pct_str)
            finding += " " + s["systemic_provenance_new_heavy"]
            findings.append(f"- {finding}")
        else:
            findings.append(f"- {s['finding_provenance_balanced'].format(pct=pct_str)}")

    # New code churn findings
    if metrics.new_code_churn_rate_2w is not None:
        rate_str = f"{metrics.new_code_churn_rate_2w:.0%}"
        if metrics.new_code_churn_rate_2w >= NEW_CODE_CHURN_2W_THRESHOLD:
            finding = s["finding_new_churn_high"].format(rate=rate_str)
            finding += " " + s["systemic_new_churn_high"]
            findings.append(f"- {finding}")
        else:
            findings.append(f"- {s['finding_new_churn_normal'].format(rate=rate_str)}")

    if not findings:
        return ""

    return "\n".join(findings)
