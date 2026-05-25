/**
 * Org-level summary queries and aggregation functions.
 * Fetches data in O(1) queries (not per-repo) and aggregates client-side.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ReportMetrics } from "@/types/metrics";
import type {
  OrgPulse,
  DeliveryQuality,
  AIvsHumanData,
  CycleTimeData,
  IntentData,
  PRHealthData,
  HealthMapEntry,
  OrgTimelineWeek,
  HyperEngineer,
} from "@/types/org-summary";
import type { RepoSummary } from "@/types/temporal";

// ---------------------------------------------------------------------------
// Query: latest JSONB payloads for all repos in an org (one query)
// ---------------------------------------------------------------------------

export async function getOrgLatestPayloads(
  supabase: SupabaseClient,
  organizationId: string,
  repoIds: string[],
): Promise<Map<string, ReportMetrics>> {
  if (repoIds.length === 0) return new Map();

  // Fetch recent payloads for the org, newest first.
  // We fetch enough rows to cover one per repo, then deduplicate client-side.
  const { data } = await supabase
    .from("metrics")
    .select("repository_id, payload")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(repoIds.length * 2);

  if (!data) return new Map();

  const map = new Map<string, ReportMetrics>();
  for (const row of data) {
    // Keep only the first (newest) per repo
    if (!map.has(row.repository_id) && row.payload) {
      map.set(row.repository_id, row.payload as ReportMetrics);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Query: active contributors deduplicated across repos
// ---------------------------------------------------------------------------

export interface OrgContributorInfo {
  count: number;
  /** Map from lowercase name → { name, github? } for avatar lookup. */
  userMap: Map<string, { name: string; github?: string }>;
}

export async function getOrgActiveContributors(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgContributorInfo> {
  const { data } = await supabase
    .from("analysis_runs")
    .select("repository_id, active_users, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data || data.length === 0) return { count: 0, userMap: new Map() };

  // Keep only the latest run per repo
  const seen = new Set<string>();
  const userMap = new Map<string, { name: string; github?: string }>();

  for (const row of data) {
    if (seen.has(row.repository_id)) continue;
    seen.add(row.repository_id);

    const users = (row.active_users ?? []) as Array<
      string | { name: string; github?: string }
    >;
    for (const u of users) {
      const parsed = typeof u === "string" ? { name: u } : u;
      const key = parsed.name.toLowerCase();
      // Keep entry with github if available
      if (!userMap.has(key) || (parsed.github && !userMap.get(key)?.github)) {
        userMap.set(key, parsed);
      }
    }
  }

  return { count: userMap.size, userMap };
}

// ---------------------------------------------------------------------------
// Pure aggregation functions
// ---------------------------------------------------------------------------

function weightedAvg(
  items: Array<{ value: number | null; weight: number }>,
): number | null {
  const valid = items.filter((i) => i.value !== null && i.weight > 0);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, i) => s + i.weight, 0);
  if (totalWeight === 0) return null;
  return valid.reduce((s, i) => s + i.value! * i.weight, 0) / totalWeight;
}

function simpleAvg(values: Array<number | null>): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

/** Build the org-wide sparkline by summing or averaging per-position across repos. */
function buildOrgSparkline(
  repos: RepoSummary[],
  mode: "sum" | "avg",
  accessor: (r: RepoSummary) => number[],
): number[] {
  const maxLen = Math.max(...repos.map((r) => accessor(r).length), 0);
  if (maxLen === 0) return [];

  const result: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    let sum = 0;
    let count = 0;
    for (const repo of repos) {
      const arr = accessor(repo);
      // Align from the end (most recent position)
      const idx = arr.length - maxLen + i;
      if (idx >= 0 && idx < arr.length) {
        sum += arr[idx];
        count++;
      }
    }
    result.push(mode === "sum" ? sum : count > 0 ? sum / count : 0);
  }
  return result;
}

// ---------------------------------------------------------------------------
// computeOrgPulse
// ---------------------------------------------------------------------------

export function computeOrgPulse(
  repos: RepoSummary[],
  payloads: Map<string, ReportMetrics>,
  activeContributors: number,
  /** Previous run's repos for delta calculation (from the metrics grouped data). */
  previousTotals?: { commits: number; prsMerged: number; aiPct: number | null },
): OrgPulse {
  const activeRepos = repos.filter((r) => r.last_run_at !== null).length;
  const totalCommits = repos.reduce((s, r) => s + (r.commits_total ?? 0), 0);
  const prsMerged = repos.reduce((s, r) => s + (r.pr_merged_count ?? 0), 0);

  const avgStabilization = weightedAvg(
    repos.map((r) => ({
      value: r.stabilization_ratio,
      weight: r.commits_total ?? 0,
    })),
  );

  const withAI = repos.filter(
    (r) =>
      r.ai_detection_coverage_pct !== null && r.ai_detection_coverage_pct > 0,
  );
  const aiAdoptionPct = weightedAvg(
    withAI.map((r) => ({
      value: r.ai_detection_coverage_pct,
      weight: r.commits_total ?? 0,
    })),
  );

  // Deltas
  const withDelta = repos.filter((r) => r.stabilization_delta !== null);
  const avgStabilizationDelta =
    withDelta.length > 0
      ? weightedAvg(
          withDelta.map((r) => ({
            value: r.stabilization_delta,
            weight: r.commits_total ?? 0,
          })),
        )
      : null;

  const totalCommitsDelta = previousTotals
    ? totalCommits - previousTotals.commits
    : null;
  const prsMergedDelta = previousTotals
    ? prsMerged - previousTotals.prsMerged
    : null;
  const aiAdoptionDelta =
    previousTotals?.aiPct !== null && aiAdoptionPct !== null && previousTotals
      ? aiAdoptionPct - previousTotals.aiPct!
      : null;

  // Sparklines
  const commitSparkline = buildOrgSparkline(repos, "sum", () => []);
  // Use stabilization sparklines from repos
  const stabSparkline = buildOrgSparkline(repos, "avg", (r) => r.sparkline);

  return {
    totalCommits,
    totalCommitsDelta,
    prsMerged,
    prsMergedDelta,
    activeRepos,
    activeContributors,
    avgStabilization,
    avgStabilizationDelta,
    aiAdoptionPct,
    aiAdoptionDelta,
    sparklines: {
      commits: commitSparkline,
      stabilization: stabSparkline,
      aiAdoption: [],
    },
  };
}

// ---------------------------------------------------------------------------
// computeDeliveryQuality
// ---------------------------------------------------------------------------

export function computeDeliveryQuality(
  repos: RepoSummary[],
  payloads: Map<string, ReportMetrics>,
): DeliveryQuality {
  const stabDistribution = repos
    .filter((r) => r.stabilization_ratio !== null)
    .map((r) => ({ name: r.name, value: r.stabilization_ratio! }));

  const revertRate = weightedAvg(
    repos.map((r) => ({
      value: r.revert_rate,
      weight: r.commits_total ?? 0,
    })),
  );

  const cascadeRate = weightedAvg(
    repos.map((r) => ({
      value: r.cascade_rate,
      weight: r.commits_total ?? 0,
    })),
  );

  const fixLatencies: Array<number | null> = [];
  const churnRates2w: Array<number | null> = [];
  const churnRates4w: Array<number | null> = [];

  for (const [, p] of payloads) {
    fixLatencies.push(p.fix_latency_median_hours ?? null);
    churnRates2w.push(p.new_code_churn_rate_2w ?? null);
    churnRates4w.push(p.new_code_churn_rate_4w ?? null);
  }

  return {
    stabilizationDistribution: stabDistribution,
    revertRate,
    cascadeRate,
    fixLatencyMedianHours: simpleAvg(fixLatencies),
    newCodeChurnRate2w: simpleAvg(churnRates2w),
    newCodeChurnRate4w: simpleAvg(churnRates4w),
    reposWithData: stabDistribution.length,
    totalRepos: repos.length,
  };
}

// ---------------------------------------------------------------------------
// computeAIvsHuman
// ---------------------------------------------------------------------------

export function computeAIvsHuman(
  payloads: Map<string, ReportMetrics>,
): AIvsHumanData | null {
  // Check if any repo has AI data
  let reposWithAI = 0;
  for (const [, p] of payloads) {
    if (
      p.ai_detection_coverage_pct != null &&
      p.ai_detection_coverage_pct > 0
    ) {
      reposWithAI++;
    }
  }
  if (reposWithAI === 0) return null;

  // Aggregate origin distributions
  let totalHuman = 0;
  let totalAI = 0;
  let totalBot = 0;

  // Stabilization by origin (weighted by files_touched)
  let stabHumanSum = 0,
    stabHumanWeight = 0;
  let stabAISum = 0,
    stabAIWeight = 0;

  // Durability by origin (weighted by lines_introduced)
  let durHumanSum = 0,
    durHumanWeight = 0;
  let durAISum = 0,
    durAIWeight = 0;

  // Cascade by origin (weighted by total_commits)
  let cascHumanSum = 0,
    cascHumanWeight = 0;
  let cascAISum = 0,
    cascAIWeight = 0;

  // Tool breakdown
  const toolCounts = new Map<string, number>();

  // Attribution gap
  let totalFlagged = 0;
  let totalHumanCommits = 0;
  let hasAttributionGap = false;

  for (const [, p] of payloads) {
    // Origin distribution
    const dist = p.commit_origin_distribution;
    if (dist) {
      totalHuman += dist.HUMAN ?? 0;
      totalAI += dist.AI_ASSISTED ?? 0;
      totalBot += dist.BOT ?? 0;
    }

    // Stabilization
    const stabO = p.stabilization_by_origin;
    if (stabO?.HUMAN) {
      stabHumanSum +=
        stabO.HUMAN.stabilization_ratio * stabO.HUMAN.files_touched;
      stabHumanWeight += stabO.HUMAN.files_touched;
    }
    if (stabO?.AI_ASSISTED) {
      stabAISum +=
        stabO.AI_ASSISTED.stabilization_ratio * stabO.AI_ASSISTED.files_touched;
      stabAIWeight += stabO.AI_ASSISTED.files_touched;
    }

    // Durability
    const durO = p.durability_by_origin;
    if (durO?.HUMAN) {
      durHumanSum += durO.HUMAN.survival_rate * durO.HUMAN.lines_introduced;
      durHumanWeight += durO.HUMAN.lines_introduced;
    }
    if (durO?.AI_ASSISTED) {
      durAISum +=
        durO.AI_ASSISTED.survival_rate * durO.AI_ASSISTED.lines_introduced;
      durAIWeight += durO.AI_ASSISTED.lines_introduced;
    }

    // Cascade
    const cascO = p.cascade_rate_by_origin;
    if (cascO?.HUMAN) {
      cascHumanSum += cascO.HUMAN.cascade_rate * cascO.HUMAN.total_commits;
      cascHumanWeight += cascO.HUMAN.total_commits;
    }
    if (cascO?.AI_ASSISTED) {
      cascAISum +=
        cascO.AI_ASSISTED.cascade_rate * cascO.AI_ASSISTED.total_commits;
      cascAIWeight += cascO.AI_ASSISTED.total_commits;
    }

    // Tool breakdown from durability_by_tool, cascade_rate_by_tool, or acceptance_by_tool
    const toolSrc =
      p.durability_by_tool ?? p.cascade_rate_by_tool ?? p.acceptance_by_tool;
    if (toolSrc) {
      for (const [tool] of Object.entries(toolSrc)) {
        const dist2 = p.commit_origin_distribution;
        // We just track which tools are present; actual commit counts come from origin dist
        toolCounts.set(tool, (toolCounts.get(tool) ?? 0) + 1);
      }
    }

    // Attribution gap
    if (p.attribution_gap) {
      hasAttributionGap = true;
      totalFlagged += p.attribution_gap.flagged_commits;
      totalHumanCommits += p.attribution_gap.total_human_commits;
    }
  }

  // Build commit mix from aggregated activity timelines
  const commitMix: AIvsHumanData["commitMix"] = [];
  const weekMap = new Map<string, { human: number; ai: number; bot: number }>();
  for (const [, p] of payloads) {
    if (!p.activity_timeline) continue;
    for (const week of p.activity_timeline) {
      const origin = week.origin ?? {};
      const existing = weekMap.get(week.week_start) ?? {
        human: 0,
        ai: 0,
        bot: 0,
      };
      existing.human += origin.HUMAN ?? 0;
      existing.ai += origin.AI_ASSISTED ?? 0;
      existing.bot += origin.BOT ?? 0;
      weekMap.set(week.week_start, existing);
    }
  }
  for (const [date, mix] of [...weekMap.entries()].sort()) {
    commitMix.push({ date, ...mix });
  }

  // Tool breakdown sorted
  const toolBreakdown = [...toolCounts.entries()]
    .map(([tool, commits]) => ({ tool, commits }))
    .sort((a, b) => b.commits - a.commits);

  return {
    commitMix,
    stabilization: {
      human: stabHumanWeight > 0 ? stabHumanSum / stabHumanWeight : null,
      ai: stabAIWeight > 0 ? stabAISum / stabAIWeight : null,
    },
    durability: {
      human: durHumanWeight > 0 ? durHumanSum / durHumanWeight : null,
      ai: durAIWeight > 0 ? durAISum / durAIWeight : null,
    },
    cascadeRate: {
      human: cascHumanWeight > 0 ? cascHumanSum / cascHumanWeight : null,
      ai: cascAIWeight > 0 ? cascAISum / cascAIWeight : null,
    },
    toolBreakdown,
    attributionGap: hasAttributionGap
      ? {
          flaggedPct:
            totalHumanCommits > 0
              ? (totalFlagged / totalHumanCommits) * 100
              : 0,
          flaggedCommits: totalFlagged,
          totalHumanCommits,
        }
      : null,
    reposWithAI,
  };
}

// ---------------------------------------------------------------------------
// computeIntentDistribution
// ---------------------------------------------------------------------------

export function computeIntentDistribution(
  payloads: Map<string, ReportMetrics>,
): IntentData | null {
  const distribution: Record<string, number> = {};
  let reposWithData = 0;

  for (const [, p] of payloads) {
    if (!p.commit_intent_distribution) continue;
    reposWithData++;
    for (const [intent, count] of Object.entries(
      p.commit_intent_distribution,
    )) {
      distribution[intent] = (distribution[intent] ?? 0) + count;
    }
  }

  if (reposWithData === 0) return null;

  const features = distribution.FEATURE ?? 0;
  const fixes = distribution.FIX ?? 0;
  const featureToFixRatio = fixes > 0 ? features / fixes : null;

  // Build timeline from activity timelines
  const weekMap = new Map<
    string,
    {
      FEATURE: number;
      FIX: number;
      REFACTOR: number;
      CONFIG: number;
      UNKNOWN: number;
    }
  >();
  for (const [, p] of payloads) {
    if (!p.activity_timeline) continue;
    for (const week of p.activity_timeline) {
      const intent = week.intent ?? {};
      const existing = weekMap.get(week.week_start) ?? {
        FEATURE: 0,
        FIX: 0,
        REFACTOR: 0,
        CONFIG: 0,
        UNKNOWN: 0,
      };
      existing.FEATURE += intent.FEATURE ?? 0;
      existing.FIX += intent.FIX ?? 0;
      existing.REFACTOR += intent.REFACTOR ?? 0;
      existing.CONFIG += intent.CONFIG ?? 0;
      existing.UNKNOWN += intent.UNKNOWN ?? 0;
      weekMap.set(week.week_start, existing);
    }
  }

  const timeline = [...weekMap.entries()]
    .sort()
    .map(([date, d]) => ({ date, ...d }));

  return {
    distribution,
    featureToFixRatio,
    timeline,
    reposWithData,
  };
}

// ---------------------------------------------------------------------------
// computePRHealth
// ---------------------------------------------------------------------------

export function computePRHealth(
  repos: RepoSummary[],
  payloads: Map<string, ReportMetrics>,
): PRHealthData | null {
  const reposWithPR = repos.filter(
    (r) => r.pr_merged_count !== null && r.pr_merged_count > 0,
  );
  if (reposWithPR.length === 0) return null;

  const totalPRsMerged = reposWithPR.reduce(
    (s, r) => s + (r.pr_merged_count ?? 0),
    0,
  );

  const ttmValues: Array<number | null> = [];
  const sprValues: Array<{ value: number | null; weight: number }> = [];
  const roundsValues: Array<number | null> = [];
  const sizeValues: Array<number | null> = [];

  let humanSPR: number | null = null,
    humanRounds: number | null = null;
  let aiSPR: number | null = null,
    aiRounds: number | null = null;
  let humanSPRCount = 0,
    aiSPRCount = 0;
  let humanRoundsCount = 0,
    aiRoundsCount = 0;

  for (const [, p] of payloads) {
    ttmValues.push(p.pr_median_time_to_merge_hours ?? null);
    sprValues.push({
      value: p.pr_single_pass_rate ?? null,
      weight: p.pr_merged_count ?? 0,
    });
    roundsValues.push(p.pr_review_rounds_median ?? null);
    sizeValues.push(p.pr_median_size_lines ?? null);

    // By origin. Skip groups where commits_in_prs == 0 — the engine defaults
    // both single_pass_rate and median_review_rounds to 0.0 in that case,
    // which would otherwise pull the averages toward zero and produce the
    // misleading "0% / 0.0" cells. The top-level pr_single_pass_rate uses a
    // separate PR-iteration code path that doesn't depend on commit→PR
    // hash linkage, so it can read 91% while these read 0.
    const acc = p.acceptance_by_origin;
    if (acc?.HUMAN && acc.HUMAN.commits_in_prs > 0) {
      humanSPR = (humanSPR ?? 0) + acc.HUMAN.single_pass_rate;
      humanSPRCount++;
      humanRounds = (humanRounds ?? 0) + acc.HUMAN.median_review_rounds;
      humanRoundsCount++;
    }
    if (acc?.AI_ASSISTED && acc.AI_ASSISTED.commits_in_prs > 0) {
      aiSPR = (aiSPR ?? 0) + acc.AI_ASSISTED.single_pass_rate;
      aiSPRCount++;
      aiRounds = (aiRounds ?? 0) + acc.AI_ASSISTED.median_review_rounds;
      aiRoundsCount++;
    }
  }

  return {
    totalPRsMerged,
    medianTimeToMergeHours: simpleAvg(ttmValues),
    singlePassRate: weightedAvg(sprValues),
    medianReviewRounds: simpleAvg(roundsValues),
    medianPRSizeLines: simpleAvg(sizeValues),
    byOrigin: {
      human:
        humanSPRCount > 0
          ? {
              singlePassRate: humanSPR! / humanSPRCount,
              medianReviewRounds:
                humanRoundsCount > 0 ? humanRounds! / humanRoundsCount : null,
            }
          : null,
      ai:
        aiSPRCount > 0
          ? {
              singlePassRate: aiSPR! / aiSPRCount,
              medianReviewRounds:
                aiRoundsCount > 0 ? aiRounds! / aiRoundsCount : null,
            }
          : null,
    },
    reposWithData: reposWithPR.length,
  };
}

// ---------------------------------------------------------------------------
// computeCycleTime — per-repo open→merge duration distribution
// ---------------------------------------------------------------------------

/**
 * Aggregate per-repo cycle-time fields emitted by the engine into the
 * shape consumed by the CycleTime dashboard section.
 *
 * Org-level mean/median are weighted by per-repo merged count. We don't
 * persist individual PR durations, so this is an approximation — but
 * the bucket counts ARE summed exactly across repos, so the
 * "% merged within 24h" KPI and the stacked distribution chart are
 * not approximations.
 */
export function computeCycleTime(
  repos: RepoSummary[],
  payloads: Map<string, ReportMetrics>,
): CycleTimeData | null {
  const repoNameById = new Map(repos.map((r) => [r.id, r.name]));

  type Row = NonNullable<CycleTimeData["perRepo"]>[number];
  const rows: Row[] = [];

  let totalMerged = 0;
  let totalWithin24h = 0;
  let medianWeightedSum = 0;
  let meanWeightedSum = 0;
  let weightTotal = 0;
  let maxP90: number | null = null;

  for (const [repoId, p] of payloads) {
    const merged = p.pr_merged_count ?? 0;
    const buckets = p.pr_cycle_time_buckets;
    if (merged <= 0 || !buckets) continue;

    const sum =
      buckets.same_day +
      buckets.one_day +
      buckets.two_to_three_days +
      buckets.four_to_seven_days +
      buckets.seven_plus_days;

    // The buckets should sum to merged. Trust the engine but fall back
    // to the sum to keep percentages internally consistent if a future
    // engine version ever changes the bucket boundaries.
    const denom = sum > 0 ? sum : merged;
    const pctWithin24h = p.pr_pct_merged_within_24h ?? buckets.same_day / denom;

    rows.push({
      name: repoNameById.get(repoId) ?? repoId,
      merged,
      pctWithin24h,
      buckets,
    });

    totalMerged += merged;
    totalWithin24h += buckets.same_day;

    if (p.pr_median_time_to_merge_hours !== undefined) {
      medianWeightedSum += p.pr_median_time_to_merge_hours * merged;
      weightTotal += merged;
    }
    if (p.pr_mean_time_to_merge_hours !== undefined) {
      meanWeightedSum += p.pr_mean_time_to_merge_hours * merged;
    }
    if (p.pr_p90_time_to_merge_hours !== undefined) {
      maxP90 =
        maxP90 === null
          ? p.pr_p90_time_to_merge_hours
          : Math.max(maxP90, p.pr_p90_time_to_merge_hours);
    }
  }

  if (rows.length === 0) return null;

  // Sort fastest-first by the within-24h share, matching the reference
  // dashboard. Ties broken by larger merged volume so a repo with one
  // same-day PR doesn't outrank a repo with hundreds.
  rows.sort((a, b) => b.pctWithin24h - a.pctWithin24h || b.merged - a.merged);

  return {
    reposWithData: rows.length,
    totalPRsMerged: totalMerged,
    pctMergedWithin24h: totalMerged > 0 ? totalWithin24h / totalMerged : null,
    medianHours: weightTotal > 0 ? medianWeightedSum / weightTotal : null,
    meanHours: weightTotal > 0 ? meanWeightedSum / weightTotal : null,
    p90Hours: maxP90,
    perRepo: rows,
  };
}

// ---------------------------------------------------------------------------
// computeHealthMap
// ---------------------------------------------------------------------------

export function computeHealthMap(repos: RepoSummary[]): HealthMapEntry[] {
  return repos
    .filter((r) => r.stabilization_ratio !== null && r.commits_total !== null)
    .map((r) => ({
      name: r.name,
      id: r.id,
      commits: r.commits_total!,
      stabilization: r.stabilization_ratio!,
      delta: r.stabilization_delta,
      health: r.health,
    }));
}

// ---------------------------------------------------------------------------
// computeOrgTimeline
// ---------------------------------------------------------------------------

export function computeOrgTimeline(
  payloads: Map<string, ReportMetrics>,
): OrgTimelineWeek[] {
  const weekMap = new Map<
    string,
    {
      commits: number;
      linesChanged: number;
      stabSum: number;
      stabWeight: number;
      churnEvents: number;
      aiSum: number;
      aiWeight: number;
      featureCount: number;
      fixCount: number;
      totalIntentCount: number;
    }
  >();

  for (const [, p] of payloads) {
    if (!p.activity_timeline) continue;
    for (const week of p.activity_timeline) {
      const existing = weekMap.get(week.week_start) ?? {
        commits: 0,
        linesChanged: 0,
        stabSum: 0,
        stabWeight: 0,
        churnEvents: 0,
        aiSum: 0,
        aiWeight: 0,
        featureCount: 0,
        fixCount: 0,
        totalIntentCount: 0,
      };

      existing.commits += week.commits;
      existing.linesChanged += week.lines_changed;
      existing.churnEvents += week.churn_events;

      if (week.stabilization_ratio != null && week.commits > 0) {
        existing.stabSum += week.stabilization_ratio * week.commits;
        existing.stabWeight += week.commits;
      }

      const origin = week.origin ?? {};
      const totalOrigin = Object.values(origin).reduce((a, b) => a + b, 0);
      const aiCommits = origin.AI_ASSISTED ?? 0;
      if (totalOrigin > 0) {
        existing.aiSum += aiCommits;
        existing.aiWeight += totalOrigin;
      }

      const intent = week.intent ?? {};
      existing.featureCount += intent.FEATURE ?? 0;
      existing.fixCount += intent.FIX ?? 0;
      existing.totalIntentCount += Object.values(intent).reduce(
        (a, b) => a + b,
        0,
      );

      weekMap.set(week.week_start, existing);
    }
  }

  return [...weekMap.entries()].sort().map(([weekStart, w]) => ({
    weekStart,
    commits: w.commits,
    linesChanged: w.linesChanged,
    stabilization: w.stabWeight > 0 ? w.stabSum / w.stabWeight : null,
    churnEvents: w.churnEvents,
    aiPct: w.aiWeight > 0 ? (w.aiSum / w.aiWeight) * 100 : null,
    featurePct:
      w.totalIntentCount > 0
        ? (w.featureCount / w.totalIntentCount) * 100
        : null,
    fixPct:
      w.totalIntentCount > 0 ? (w.fixCount / w.totalIntentCount) * 100 : null,
  }));
}

// ---------------------------------------------------------------------------
// computePreviousTotals — extract previous-run totals for delta calculation
// ---------------------------------------------------------------------------

export function computePreviousTotals(
  repos: RepoSummary[],
  allMetrics: Array<{
    repository_id: string;
    commits_total: number | null;
    pr_merged_count: number | null;
    ai_detection_coverage_pct: number | null;
  }>,
): { commits: number; prsMerged: number; aiPct: number | null } {
  // Group by repo, second row is previous
  const byRepo = new Map<string, typeof allMetrics>();
  for (const row of allMetrics) {
    const existing = byRepo.get(row.repository_id) ?? [];
    existing.push(row);
    byRepo.set(row.repository_id, existing);
  }

  let commits = 0;
  let prsMerged = 0;
  const aiValues: number[] = [];

  for (const repo of repos) {
    const rows = byRepo.get(repo.id) ?? [];
    const prev = rows[1]; // second row = previous run (rows are newest-first)
    if (!prev) continue;
    commits += prev.commits_total ?? 0;
    prsMerged += prev.pr_merged_count ?? 0;
    if (
      prev.ai_detection_coverage_pct != null &&
      prev.ai_detection_coverage_pct > 0
    ) {
      aiValues.push(prev.ai_detection_coverage_pct);
    }
  }

  return {
    commits,
    prsMerged,
    aiPct:
      aiValues.length > 0
        ? aiValues.reduce((s, v) => s + v, 0) / aiValues.length
        : null,
  };
}

// ---------------------------------------------------------------------------
// computeHyperEngineers — aggregate across repos, deduplicate by name
// ---------------------------------------------------------------------------

export function computeHyperEngineers(
  payloads: Map<string, ReportMetrics>,
  userMap: Map<string, { name: string; github?: string }>,
): HyperEngineer[] {
  // Accumulate per-author stats across repos
  const authors = new Map<
    string,
    {
      name: string;
      repos: number;
      hvWeeks: number;
      aiPct: number;
      aiCount: number;
    }
  >();

  for (const [, p] of payloads) {
    if (!p.author_velocity?.authors) continue;
    const av = p.author_velocity;

    for (const a of av.authors) {
      const key = a.name.toLowerCase();
      const isHyper = a.high_velocity_weeks > 0 || a.ai_commit_pct >= 80;
      if (!isHyper) continue;

      const existing = authors.get(key) ?? {
        name: a.name,
        repos: 0,
        hvWeeks: 0,
        aiPct: 0,
        aiCount: 0,
      };
      existing.repos++;
      existing.hvWeeks = Math.max(existing.hvWeeks, a.high_velocity_weeks);
      existing.aiPct += a.ai_commit_pct;
      existing.aiCount++;
      authors.set(key, existing);
    }
  }

  return [...authors.entries()]
    .map(([key, a]) => {
      const userInfo = userMap.get(key);
      return {
        name: userInfo?.name ?? a.name,
        github: userInfo?.github,
        repos: a.repos,
        highVelocityWeeks: a.hvWeeks,
        aiCommitPct: a.aiCount > 0 ? a.aiPct / a.aiCount : 0,
      };
    })
    .sort((a, b) => b.repos - a.repos);
}

// DORA aggregation moved to `lib/queries/dora.ts` — it reads directly
// from the `external_*` tables now. The old per-payload sum here was
// multiplying counts by the number of repos that had pushed (because
// every payload carried the same org-wide event slice). See
// `computeOrgDORA` and `computeRepoDORA` for the replacements.
