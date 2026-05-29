import { notFound, redirect } from "next/navigation";

import { getServerSession } from "next-auth/next";

import { RepoCharts } from "./charts";
import { DORARepoCard } from "./dora-card";
import { GitHubAvatar } from "./github-avatar";
import { InvestmentHotspots } from "./investment-hotspots";

import { AdoptionTimelineCard } from "@/components/charts/AdoptionTimelineCard";
import { ChangeAlert } from "@/components/charts/ChangeAlert";
import { MetricCard } from "@/components/charts/MetricCard";
import { authOptions } from "@/lib/auth";
import { extractAdoptionSummary } from "@/lib/queries/adoption-timeline";
import { computeRepoDORA } from "@/lib/queries/dora";
import { computeInvestmentHotspots } from "@/lib/queries/invest-here";
import {
  getRepoTimeSeries,
  getRepoLatestPayload,
  getRepoAITimeSeries,
  detectChanges,
} from "@/lib/queries/temporal";
import { getServerTranslation } from "@/lib/server-translation";
import { supabaseAdmin } from "@/lib/supabase";
import type { ReportMetrics } from "@/types/metrics";

function extractInsights(payload: Record<string, unknown> | null) {
  if (!payload) return {};

  return {
    intentDistribution: payload.commit_intent_distribution as
      | Record<string, number>
      | undefined,
    originDistribution: payload.commit_origin_distribution as
      | Record<string, number>
      | undefined,
    stabilizationByOrigin: payload.stabilization_by_origin as
      | Record<string, { stabilization_ratio: number; files_touched: number }>
      | undefined,
    cascadeRate: payload.cascade_rate as number | undefined,
    cascadeMedianDepth: payload.cascade_median_depth as number | undefined,
    cascadeByOrigin: payload.cascade_rate_by_origin as
      | Record<
          string,
          { cascade_rate: number; cascades: number; total_commits: number }
        >
      | undefined,
    durabilityByOrigin: payload.durability_by_origin as
      | Record<
          string,
          {
            survival_rate: number;
            lines_introduced: number;
            lines_surviving: number;
            median_age_days: number;
          }
        >
      | undefined,
    activityTimeline: payload.activity_timeline as
      | Array<{
          week_start: string;
          commits: number;
          lines_changed: number;
          intent?: Record<string, number>;
          origin?: Record<string, number>;
        }>
      | undefined,
    flowLoad: payload.flow_load as
      | Array<{
          bucket: string;
          bucket_start: string;
          bucket_end: string;
          wip_total: number;
          wip_by_intent: Partial<Record<string, number>>;
          author_concurrency: number;
        }>
      | undefined,
    flowEfficiencyMedian: payload.flow_efficiency_median as number | undefined,
    flowEfficiencyByIntent: payload.flow_efficiency_by_intent as
      | Partial<Record<string, number>>
      | undefined,
    timeInPhaseMedianHours: payload.time_in_phase_median_hours as
      | Partial<Record<string, number>>
      | undefined,
    medianTimeToFirstReviewHours: payload.median_time_to_first_review_hours as
      | number
      | undefined,
    humanReviewCoveragePct: payload.human_review_coverage_pct as
      | number
      | undefined,
    humanApprovalCoveragePct: payload.human_approval_coverage_pct as
      | number
      | undefined,
    humanReviewCoverageByIntent: payload.human_review_coverage_by_intent as
      | Partial<Record<string, number>>
      | undefined,
    humanReviewCoverageByOriginOfPr:
      payload.human_review_coverage_by_origin_of_pr as
        | Partial<Record<string, number>>
        | undefined,
  };
}

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; repoName: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const { tenant, repoName } = await params;
  const decodedRepoName = decodeURIComponent(repoName);
  const { t } = await getServerTranslation();

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("slug", tenant)
    .single();
  if (!org) notFound();

  const { data: membership } = await supabaseAdmin
    .from("organization_members")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("organization_id", org.id)
    .single();

  const role = membership?.role as "owner" | "admin" | "member" | undefined;
  const canSeeHyperEngineers = role === "owner" || role === "admin";

  const { data: repo } = await supabaseAdmin
    .from("repositories")
    .select("id, name, remote_url")
    .eq("organization_id", org.id)
    .eq("name", decodedRepoName)
    .single();
  if (!repo) notFound();

  const [timeSeries, payload, aiImpact, repoDORA] = await Promise.all([
    getRepoTimeSeries(supabaseAdmin, repo.id),
    getRepoLatestPayload(supabaseAdmin, repo.id),
    getRepoAITimeSeries(supabaseAdmin, repo.id),
    computeRepoDORA(supabaseAdmin, org.id, repo.id, { windowDays: 30 }),
  ]);

  const insights = extractInsights(payload);
  const hotspots = computeInvestmentHotspots(payload as ReportMetrics | null);
  const adoptionSummary = extractAdoptionSummary(
    payload as ReportMetrics | null,
  );

  // Extract high-velocity and AI-native authors from payload
  const authorVelocity =
    (payload?.author_velocity as {
      authors?: Array<{
        name: string;
        high_velocity_weeks: number;
        ai_commit_pct: number;
      }>;
    }) ?? {};
  const hyperEngineers = new Set(
    (authorVelocity.authors ?? [])
      .filter((a) => a.high_velocity_weeks > 0 || a.ai_commit_pct >= 80)
      .map((a) => a.name),
  );

  const latest =
    timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : null;
  const previous =
    timeSeries.length > 1 ? timeSeries[timeSeries.length - 2] : null;

  const changes =
    latest && previous
      ? detectChanges(repo.name, repo.id, latest, previous)
      : [];

  const stabDelta =
    latest?.stabilization_ratio != null && previous?.stabilization_ratio != null
      ? latest.stabilization_ratio - previous.stabilization_ratio
      : null;
  const revertDelta =
    latest?.revert_rate != null && previous?.revert_rate != null
      ? latest.revert_rate - previous.revert_rate
      : null;
  const churnDelta =
    latest?.churn_events != null && previous?.churn_events != null
      ? latest.churn_events - previous.churn_events
      : null;
  const commitsDelta =
    latest?.commits_total != null && previous?.commits_total != null
      ? latest.commits_total - previous.commits_total
      : null;

  const { data: runs } = await supabaseAdmin
    .from("analysis_runs")
    .select(
      "id, commits_total, window_days, cli_version, active_users, created_at",
    )
    .eq("repository_id", repo.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get active users from latest run (supports both string[] and {name, github}[] formats)
  const rawActiveUsers: (string | { name: string; github?: string })[] =
    runs?.[0]?.active_users ?? [];
  const activeUsers = rawActiveUsers.map((u) =>
    typeof u === "string" ? { name: u } : u,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold">{repo.name}</h1>
        {repo.remote_url && (
          <p className="text-sm text-muted-foreground">{repo.remote_url}</p>
        )}
      </div>

      <ChangeAlert changes={changes} tenantSlug={tenant} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("repos.detail.metrics.stabilization")}
          value={
            latest?.stabilization_ratio != null
              ? `${(latest.stabilization_ratio * 100).toFixed(0)}%`
              : "\u2014"
          }
          delta={stabDelta}
        />
        <MetricCard
          label={t("repos.detail.metrics.revertRate")}
          value={
            latest?.revert_rate != null
              ? `${(latest.revert_rate * 100).toFixed(1)}%`
              : "\u2014"
          }
          delta={revertDelta}
          invertDelta
        />
        <MetricCard
          label={t("repos.detail.metrics.churnEvents")}
          value={latest?.churn_events?.toString() ?? "\u2014"}
          delta={churnDelta}
          deltaFormat="abs"
          invertDelta
        />
        <MetricCard
          label={t("repos.detail.metrics.commits")}
          value={latest?.commits_total?.toString() ?? "\u2014"}
          delta={commitsDelta}
          deltaFormat="abs"
        />
      </div>

      <RepoCharts
        timeSeries={timeSeries}
        insights={insights}
        aiImpact={aiImpact}
      />

      {repoDORA && <DORARepoCard data={repoDORA} />}

      <AdoptionTimelineCard summary={adoptionSummary} compact />

      <InvestmentHotspots data={hotspots} />

      {activeUsers.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-medium">
            {t("repos.detail.activeContributors")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeUsers.map((user) => (
              <div
                key={user.name}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                {user.github ? (
                  <GitHubAvatar username={user.github} name={user.name} />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.github ? (
                  <a
                    href={`https://github.com/${user.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {user.name}
                  </a>
                ) : (
                  <span className="text-sm">{user.name}</span>
                )}
                {canSeeHyperEngineers && hyperEngineers.has(user.name) && (
                  <span title={t("dashboard.hyperEngineers.badge")}>🏆</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              activeUsers.length === 1
                ? "repos.detail.contributorsCount"
                : "repos.detail.contributorsCountPlural",
              { count: activeUsers.length },
            )}
          </p>
        </div>
      )}

      {runs && runs.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-medium">
            {t("repos.detail.runHistory")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">
                    {t("repos.detail.runColumns.date")}
                  </th>
                  <th className="pb-2 pr-4">
                    {t("repos.detail.runColumns.commits")}
                  </th>
                  <th className="pb-2 pr-4">
                    {t("repos.detail.runColumns.window")}
                  </th>
                  <th className="pb-2">{t("repos.detail.runColumns.cli")}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      {new Date(run.created_at).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2 pr-4">{run.commits_total}</td>
                    <td className="py-2 pr-4">{run.window_days}d</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {run.cli_version ?? "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
