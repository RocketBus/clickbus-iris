/**
 * Types for org-level aggregated summary.
 * All interfaces represent pre-computed data passed to client section components.
 */

/** Hero cards — top-level org pulse. */
export interface OrgPulse {
  totalCommits: number;
  totalCommitsDelta: number | null;
  prsMerged: number;
  prsMergedDelta: number | null;
  activeRepos: number;
  activeContributors: number;
  avgStabilization: number | null;
  avgStabilizationDelta: number | null;
  aiAdoptionPct: number | null;
  aiAdoptionDelta: number | null;
  sparklines: {
    commits: number[];
    stabilization: number[];
    aiAdoption: number[];
  };
}

/** Delivery quality signals aggregated across all repos. */
export interface DeliveryQuality {
  /** Per-repo stabilization values for distribution chart. */
  stabilizationDistribution: Array<{ name: string; value: number }>;
  revertRate: number | null;
  cascadeRate: number | null;
  fixLatencyMedianHours: number | null;
  newCodeChurnRate2w: number | null;
  newCodeChurnRate4w: number | null;
  reposWithData: number;
  totalRepos: number;
}

/** AI vs Human comparison data. */
export interface AIvsHumanData {
  /** Org-wide commit mix timeline (aggregated across repos). */
  commitMix: Array<{
    date: string;
    human: number;
    ai: number;
    bot: number;
  }>;
  stabilization: { human: number | null; ai: number | null };
  durability: { human: number | null; ai: number | null };
  cascadeRate: { human: number | null; ai: number | null };
  /** AI tool usage counts across all repos. */
  toolBreakdown: Array<{ tool: string; commits: number }>;
  attributionGap: {
    flaggedPct: number;
    flaggedCommits: number;
    totalHumanCommits: number;
  } | null;
  reposWithAI: number;
}

/** Intent distribution aggregated across all repos. */
export interface IntentData {
  distribution: Record<string, number>;
  featureToFixRatio: number | null;
  /** Weekly intent trend (aggregated). */
  timeline: Array<{
    date: string;
    FEATURE: number;
    FIX: number;
    REFACTOR: number;
    CONFIG: number;
    UNKNOWN: number;
  }>;
  reposWithData: number;
}

/** PR health metrics aggregated across all repos. */
export interface PRHealthData {
  totalPRsMerged: number;
  medianTimeToMergeHours: number | null;
  singlePassRate: number | null;
  medianReviewRounds: number | null;
  medianPRSizeLines: number | null;
  byOrigin: {
    human: {
      singlePassRate: number | null;
      medianReviewRounds: number | null;
    } | null;
    ai: {
      singlePassRate: number | null;
      medianReviewRounds: number | null;
    } | null;
  };
  reposWithData: number;
}

/**
 * Cycle Time view — how long the org takes to go from PR open to merge.
 *
 * Aggregates the engine's per-repo cycle-time distribution into both
 * org-wide totals (the four KPI cards) and per-repo breakdowns (the
 * "% merged within 24h" ranking and the stacked bucket chart).
 */
export interface CycleTimeData {
  /** Number of repos that contributed at least one merged PR in the window. */
  reposWithData: number;
  /** Total merged PRs across all repos. */
  totalPRsMerged: number;
  /** Fraction (0.0–1.0) of merged PRs whose cycle time was ≤ 24h. */
  pctMergedWithin24h: number | null;
  /** Hours. Org-level median, weighted by per-repo merged count. */
  medianHours: number | null;
  /** Hours. Org-level mean, weighted by per-repo merged count. */
  meanHours: number | null;
  /** Hours. Worst-case P90 across repos (max of repo P90s). */
  p90Hours: number | null;
  /** Per-repo rows, sorted from fastest to slowest. */
  perRepo: Array<{
    name: string;
    merged: number;
    pctWithin24h: number;
    buckets: {
      same_day: number;
      one_day: number;
      two_to_three_days: number;
      four_to_seven_days: number;
      seven_plus_days: number;
    };
  }>;
}

/** Single entry for the health map treemap. */
export interface HealthMapEntry {
  name: string;
  id: string;
  commits: number;
  stabilization: number;
  delta: number | null;
  health: string;
}

/** A hyper engineer detected across the org. */
export interface HyperEngineer {
  name: string;
  github?: string;
  /** Number of repos where this person qualified. */
  repos: number;
  highVelocityWeeks: number;
  aiCommitPct: number;
}

/** Single week in the org-wide timeline. */
export interface OrgTimelineWeek {
  weekStart: string;
  commits: number;
  linesChanged: number;
  stabilization: number | null;
  churnEvents: number;
  aiPct: number | null;
  featurePct: number | null;
  fixPct: number | null;
}

/**
 * DORA (real) aggregated org-wide from the `external_*` tables.
 *
 * Counts and percentile-based aggregates come from a single query against
 * `external_deployments` and `external_incidents` — single source of
 * truth, no double-counting across per-repo payloads. The two
 * `_by_origin` fields are the exception: they're engine-derived (need
 * the per-commit join against local origin classification) and
 * accumulated from the latest payload of every repo with a successful
 * push under an active integration.
 */
export interface OrgDORA {
  reposWithData: number;
  deploymentsTotal: number;
  deploymentsFailed: number;
  deploymentsPendingEvaluation: number;
  incidentsTotal: number;
  /** 0.0–1.0. Failed / evaluated (excludes pending). */
  cfr: number | null;
  rollbacksTotal: number;
  /** 0.0–1.0. Rollbacks / failed deploys. */
  rollbackRate: number | null;
  /** Seconds. Median of `recovery_time_sec` over failed deploys. */
  mttrPerDeploySecondsMedian: number | null;
  /** Seconds. Median of `time_to_restore_seconds` over incident events. */
  mttrPerIncidentSecondsMedian: number | null;
  /** Seconds. Median across every commit on every deploy in the window. */
  leadTimeSecondsMedian: number | null;
  /** Deploys per calendar day across the queried window. */
  deployFrequencyPerDay: number | null;
  /** Per-origin CFR aggregation across the org. */
  cfrByOrigin: Array<{
    origin: "HUMAN" | "AI_ASSISTED" | "BOT";
    failed: number;
    evaluated: number;
    cfr: number;
  }>;
  /** Per-origin rollback aggregation across the org. */
  rollbackRateByOrigin: Array<{
    origin: "HUMAN" | "AI_ASSISTED" | "BOT";
    rollbacks: number;
    failed: number;
    rollbackRate: number;
  }>;
}

/**
 * DORA (real) scoped to a single repository.
 *
 * Computed from `external_deployments` filtered by `repository_id`.
 * Incident-derived MTTR is intentionally omitted: Datadog failures
 * don't carry repository attribution, so any per-repo MTTR-per-incident
 * would be a misleading copy of the org-wide number.
 */
export interface RepoDORA {
  /** Inclusive window size used to compute these metrics. */
  windowDays: number;
  deploymentsTotal: number;
  deploymentsFailed: number;
  deploymentsPendingEvaluation: number;
  cfr: number | null;
  mttrPerDeploySecondsMedian: number | null;
  rollbacksTotal: number;
  rollbackRate: number | null;
  leadTimeSecondsMedian: number | null;
  deployFrequencyPerDay: number | null;
}
