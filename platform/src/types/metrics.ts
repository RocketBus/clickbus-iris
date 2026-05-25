/**
 * TypeScript types matching iris/models/metrics.py ReportMetrics.
 * Used for validating CLI ingest payloads.
 */

export type CommitOrigin = "HUMAN" | "AI_ASSISTED" | "BOT";
export type ChangeIntent =
  | "FEATURE"
  | "FIX"
  | "REFACTOR"
  | "CONFIG"
  | "UNKNOWN";

export interface OriginMetrics {
  churn_events: number;
  churn_lines_affected: number;
}

export interface StabilizationMetrics {
  files_stabilized: number;
  files_touched: number;
  stabilization_ratio: number;
}

export interface CommitShapeMetrics {
  commit_count: number;
  median_files_changed: number;
  median_total_lines: number;
  median_lines_per_file: number;
  median_directory_spread: number;
  dominant_shape: string;
}

export interface FixLatencyMetrics {
  median_latency_hours: number;
  fast_rework_pct: number;
  rework_count: number;
}

export interface CascadeMetrics {
  total_commits: number;
  cascades: number;
  cascade_rate: number;
  median_depth: number;
}

export interface DurabilityMetrics {
  lines_introduced: number;
  lines_surviving: number;
  survival_rate: number;
  median_age_days: number;
}

export interface DuplicateMetrics {
  commits_analyzed: number;
  commits_with_duplicates: number;
  duplicate_rate: number;
  total_duplicate_blocks: number;
  median_block_size: number;
}

export interface NewCodeChurnMetrics {
  files_with_new_code: number;
  files_churned_2w: number;
  files_churned_4w: number;
  churn_rate_2w: number;
  churn_rate_4w: number;
}

export interface RevertMetrics {
  reverts: number;
  revert_rate: number;
}

export interface FixTargetMetrics {
  fixes_attracted: number;
  code_share_pct: number;
  fix_share_pct: number;
  disproportionality: number;
}

export interface AcceptanceMetrics {
  total_commits: number;
  commits_in_prs: number;
  pr_rate: number;
  single_pass_rate: number;
  median_review_rounds: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversion: number;
}

export interface OriginFunnel {
  stages: FunnelStage[];
  overall_conversion: number;
}

export interface StabilityMapEntry {
  directory: string;
  files_touched: number;
  files_stabilized: number;
  stabilization_ratio: number;
  churn_events: number;
}

export interface ChurnFileEntry {
  file: string;
  touches: number;
  total_lines: number;
  fix_count: number;
  chain: string;
  first_touch: string;
  last_touch: string;
}

export interface ChurnCoupling {
  file_a: string;
  file_b: string;
  co_occurrences: number;
  coupling_rate: number;
}

export interface ActivityWeek {
  week_start: string;
  week_end: string;
  commits: number;
  lines_changed: number;
  intent: Record<string, number>;
  origin: Record<string, number>;
  stabilization_ratio: number;
  churn_events: number;
  prs_merged?: number;
  pr_median_ttm_hours?: number;
}

export interface ActivityPattern {
  pattern: string;
  week: string;
  description: string;
}

export interface FlowLoadWeek {
  bucket: string; // ISO week label, e.g. "2026-W18"
  bucket_start: string; // YYYY-MM-DD (Monday)
  bucket_end: string; // YYYY-MM-DD (Sunday)
  wip_total: number;
  wip_by_intent: Partial<Record<ChangeIntent, number>>;
  author_concurrency: number;
}

export interface VelocityWindow {
  start: string;
  end: string;
  commits_per_week: number;
  stabilization_ratio: number;
  churn_rate: number;
}

export interface VelocityResult {
  commits_per_week: number;
  lines_per_week: number;
  trend: string;
  trend_change_pct: number;
  durability_correlation: string;
  windows: VelocityWindow[];
}

/**
 * The complete metrics payload from the CLI.
 * Matches ReportMetrics.to_dict() output — only non-None fields are present.
 */
export interface ReportMetrics {
  // Core (always present)
  commits_total: number;
  commits_revert: number;
  revert_rate: number;
  revert_by_origin?: Record<CommitOrigin, RevertMetrics>;
  revert_by_tool?: Record<string, { reverts: number }>;
  fix_target_by_origin?: Record<CommitOrigin, FixTargetMetrics>;
  fix_target_by_tool?: Record<string, { fixes_attracted: number }>;
  churn_events: number;
  churn_lines_affected: number;
  files_touched: number;
  files_stabilized: number;
  stabilization_ratio: number;

  // Intent
  commit_intent_distribution?: Record<ChangeIntent, number>;
  churn_by_intent?: Record<ChangeIntent, OriginMetrics>;
  stabilization_by_intent?: Record<ChangeIntent, StabilizationMetrics>;
  lines_changed_by_intent?: Record<ChangeIntent, number>;

  // Origin
  ai_detection_coverage_pct?: number;
  commit_origin_distribution?: Record<CommitOrigin, number>;
  stabilization_by_origin?: Record<CommitOrigin, StabilizationMetrics>;
  churn_by_origin?: Record<CommitOrigin, OriginMetrics>;

  // Commit shape
  commit_shape_by_origin?: Record<CommitOrigin, CommitShapeMetrics>;
  commit_shape_dominant?: string;

  // Fix latency
  fix_latency_median_hours?: number;
  fix_latency_by_origin?: Record<CommitOrigin, FixLatencyMetrics>;

  // Stability map
  stability_map?: StabilityMapEntry[];

  // Correction cascades
  cascade_rate?: number;
  cascade_rate_by_origin?: Record<CommitOrigin, CascadeMetrics>;
  cascade_rate_by_tool?: Record<string, CascadeMetrics>;
  cascade_median_depth?: number;

  // Code durability
  durability_by_origin?: Record<CommitOrigin, DurabilityMetrics>;
  durability_by_tool?: Record<string, DurabilityMetrics>;
  durability_files_analyzed?: number;

  // Acceptance rate
  acceptance_by_origin?: Record<CommitOrigin, AcceptanceMetrics>;
  acceptance_by_tool?: Record<string, AcceptanceMetrics>;

  // Origin funnel
  origin_funnel?: Record<CommitOrigin, OriginFunnel>;

  // Attribution gap
  attribution_gap?: {
    flagged_commits: number;
    total_human_commits: number;
    flagged_pct: number;
    avg_loc: number;
    avg_files: number;
    avg_interval_minutes: number;
  };

  // Churn detail
  churn_top_files?: ChurnFileEntry[];
  churn_couplings?: ChurnCoupling[];

  // Activity timeline
  activity_timeline?: ActivityWeek[];
  activity_patterns?: ActivityPattern[];

  // Flow Load — WIP simultâneo per ISO week
  flow_load?: FlowLoadWeek[];

  // Flow Efficiency — active vs wait decomposition of merged PR lifecycle
  flow_efficiency_median?: number; // 0.0–1.0
  flow_efficiency_by_intent?: Partial<Record<ChangeIntent, number>>;
  flow_efficiency_by_origin?: Partial<Record<CommitOrigin, number>>;
  time_in_phase_median_hours?: {
    coding?: number;
    awaiting_first_review?: number;
    in_review_active?: number;
    in_review_wait?: number;
    awaiting_merge?: number;
  };
  median_time_to_first_review_hours?: number;

  // DORA (real) — populated when the org has an active Datadog integration
  // and the engine fetched events for the analysis window. Every field
  // here is optional; `dora_source` is the canonical "is there data?" flag.
  dora_source?: "datadog";
  dora_deployments_total?: number;
  dora_deployments_failed?: number;
  dora_deployments_pending_evaluation?: number;
  dora_incidents_total?: number;
  dora_cfr?: number; // 0.0–1.0
  dora_mttr_per_deploy_seconds_median?: number;
  dora_mttr_per_deploy_seconds_p90?: number;
  dora_mttr_per_incident_seconds_median?: number;
  dora_mttr_per_incident_seconds_p90?: number;
  dora_rollback_rate?: number; // 0.0–1.0
  dora_rollbacks_total?: number;
  dora_lead_time_seconds_median?: number;
  dora_deploy_frequency_per_day?: number;
  dora_remediation_distribution?: Record<string, number>;
  // Populated only when the analysis run had both DORA events and local
  // commit-origin classification. Keys mirror `CommitOrigin` values.
  dora_cfr_by_origin?: Partial<
    Record<
      CommitOrigin,
      {
        failed: number;
        evaluated: number;
        cfr: number | null;
      }
    >
  >;
  dora_rollback_rate_by_origin?: Partial<
    Record<
      CommitOrigin,
      {
        rollbacks: number;
        failed: number;
        rollback_rate: number | null;
      }
    >
  >;
  /** Org-wide attribution coverage for the two by-origin maps above. 0-100. */
  dora_cfr_by_origin_coverage_pct?: number;

  // PR lifecycle
  pr_merged_count?: number;
  pr_median_time_to_merge_hours?: number;
  // Cycle-time distribution — populated together with pr_merged_count.
  // The platform aggregates bucket counts across repos to render an
  // org-level distribution without persisting individual PR durations.
  pr_mean_time_to_merge_hours?: number;
  pr_p90_time_to_merge_hours?: number;
  pr_pct_merged_within_24h?: number;
  pr_cycle_time_buckets?: {
    same_day: number;
    one_day: number;
    two_to_three_days: number;
    four_to_seven_days: number;
    seven_plus_days: number;
  };
  pr_median_size_files?: number;
  pr_median_size_lines?: number;
  pr_review_rounds_median?: number;
  pr_single_pass_rate?: number;

  // Duplicate block detection
  duplicate_block_rate?: number;
  duplicate_block_count?: number;
  duplicate_median_block_size?: number;
  duplicate_by_origin?: Record<CommitOrigin, DuplicateMetrics>;
  duplicate_by_tool?: Record<string, DuplicateMetrics>;

  // New code churn
  new_code_churn_rate_2w?: number;
  new_code_churn_rate_4w?: number;
  new_code_churn_by_origin?: Record<CommitOrigin, NewCodeChurnMetrics>;
  new_code_churn_by_tool?: Record<string, NewCodeChurnMetrics>;

  // Velocity
  velocity?: VelocityResult;

  // Author velocity
  author_velocity?: {
    authors: Array<{
      name: string;
      email?: string;
      total_commits?: number;
      high_velocity_weeks: number;
      ai_commit_pct: number;
      // Per-week breakdown emitted by iris >= 1.0.2. The `ai_commits` field
      // is present from that version onward; older payloads omit it.
      weekly?: Array<{
        week_start: string;
        commits: number;
        lines_added: number;
        lines_removed: number;
        ai_commits?: number;
      }>;
    }>;
  };

  // Adoption timeline
  adoption_timeline?: AdoptionTimeline;
}

export type AdoptionConfidence = "clear" | "sparse" | "insufficient";

export interface AdoptionTimeline {
  first_ai_commit_date: string; // ISO YYYY-MM-DD
  adoption_ramp_start: string;
  adoption_ramp_end: string | null;
  adoption_confidence: AdoptionConfidence;
  total_ai_commits: number;
  pre_adoption: ReportMetrics;
  post_adoption: ReportMetrics;
}
