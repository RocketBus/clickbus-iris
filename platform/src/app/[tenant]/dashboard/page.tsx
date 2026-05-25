import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getServerSession } from "next-auth/next";

import { RepoList } from "./repo-list";
import { AIDeliveryTimeline } from "./sections/AIDeliveryTimeline";
import { AIvsHuman } from "./sections/AIvsHuman";
import { CycleTime } from "./sections/CycleTime";
import { DeliveryQuality } from "./sections/DeliveryQuality";
import { DORAOverview } from "./sections/DORAOverview";
import { HealthMap } from "./sections/HealthMap";
import { HyperEngineers } from "./sections/HyperEngineers";
import { IntentDistribution } from "./sections/IntentDistribution";
import { OrgPulse } from "./sections/OrgPulse";
import { OrgTimeline } from "./sections/OrgTimeline";
import { PRHealth } from "./sections/PRHealth";
import { ToolComparison } from "./sections/ToolComparison";

import { ChangeAlert } from "@/components/charts/ChangeAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { computeOrgAdoption } from "@/lib/queries/adoption-timeline";
import { computeOrgDORA } from "@/lib/queries/dora";
import {
  getOrgLatestPayloads,
  getOrgActiveContributors,
  computeOrgPulse,
  computeDeliveryQuality,
  computeAIvsHuman,
  computeCycleTime,
  computeIntentDistribution,
  computePRHealth,
  computeHealthMap,
  computeOrgTimeline,
  computePreviousTotals,
  computeHyperEngineers,
} from "@/lib/queries/org-summary";
import {
  getOrgReposSummary,
  getOrgChangeDetections,
} from "@/lib/queries/temporal";
import { computeToolComparison } from "@/lib/queries/tool-comparison";
import { getServerTranslation } from "@/lib/server-translation";
import { supabaseAdmin } from "@/lib/supabase";

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const { tenant } = await params;

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, name")
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

  // Fetch all data in parallel
  const [repoSummaries, changes, contributorInfo] = await Promise.all([
    getOrgReposSummary(supabaseAdmin, org.id),
    getOrgChangeDetections(supabaseAdmin, org.id),
    getOrgActiveContributors(supabaseAdmin, org.id),
  ]);

  // Fetch latest payloads for all repos (needs repo IDs)
  const repoIds = repoSummaries.map((r) => r.id);
  const payloads = await getOrgLatestPayloads(supabaseAdmin, org.id, repoIds);

  // Fetch raw metrics for previous-period delta calculation
  const { data: allMetricsRaw } = await supabaseAdmin
    .from("metrics")
    .select(
      "repository_id, commits_total, pr_merged_count, ai_detection_coverage_pct",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(repoSummaries.length * 15);

  const previousTotals = computePreviousTotals(
    repoSummaries,
    allMetricsRaw ?? [],
  );

  // Compute all aggregations
  const pulseData = computeOrgPulse(
    repoSummaries,
    payloads,
    contributorInfo.count,
    previousTotals,
  );
  const qualityData = computeDeliveryQuality(repoSummaries, payloads);
  const aiData = computeAIvsHuman(payloads);
  const intentData = computeIntentDistribution(payloads);
  const prData = computePRHealth(repoSummaries, payloads);
  const cycleTimeData = computeCycleTime(repoSummaries, payloads);
  const healthMapEntries = computeHealthMap(repoSummaries);
  const timelineData = computeOrgTimeline(payloads);
  const hyperEngineers = computeHyperEngineers(
    payloads,
    contributorInfo.userMap,
  );
  const toolComparisonData = computeToolComparison(payloads);
  const doraData = await computeOrgDORA(supabaseAdmin, org.id, {
    windowDays: 30,
    payloads,
  });
  const repoNameIndex = new Map(repoSummaries.map((r) => [r.id, r.name]));
  const adoptionRows = computeOrgAdoption(payloads, repoNameIndex);

  const hasData = repoSummaries.some((r) => r.stabilization_ratio !== null);

  if (repoSummaries.length === 0) {
    const { t } = await getServerTranslation();
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-muted-foreground">0 repositories</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              {t("connect.subtitle")}
            </p>
            <Button asChild>
              <Link href={`/${tenant}/connect`}>
                {t("connect.emptyStateLink")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          {repoSummaries.length} repositories
        </p>
      </div>

      {/* Change detection alerts */}
      <ChangeAlert changes={changes} tenantSlug={tenant} />

      {/* Org pulse hero cards */}
      {hasData && <OrgPulse data={pulseData} />}

      {/* Delivery quality */}
      <DeliveryQuality data={qualityData} />

      {/* DORA — real metrics from a connected Datadog integration */}
      {doraData && <DORAOverview data={doraData} />}

      {/* AI vs Human */}
      {aiData && <AIvsHuman data={aiData} tenantSlug={tenant} />}

      {/* AI delivery timeline — what changed after adoption */}
      <AIDeliveryTimeline rows={adoptionRows} orgSlug={tenant} />

      {/* AI tool comparison */}
      {toolComparisonData && <ToolComparison data={toolComparisonData} />}

      {/* Intent distribution */}
      {intentData && <IntentDistribution data={intentData} />}

      {/* PR health */}
      {prData && <PRHealth data={prData} />}

      {/* Cycle time — open-to-merge duration distribution per repo */}
      {cycleTimeData && <CycleTime data={cycleTimeData} />}

      {/* Health map */}
      <HealthMap entries={healthMapEntries} orgSlug={tenant} />

      {/* Org timeline */}
      <OrgTimeline data={timelineData} />

      {/* Hyper engineers — restrito a owner/admin */}
      {canSeeHyperEngineers && <HyperEngineers engineers={hyperEngineers} />}

      {/* Repo list */}
      <RepoList repos={repoSummaries} orgSlug={tenant} />
    </div>
  );
}
