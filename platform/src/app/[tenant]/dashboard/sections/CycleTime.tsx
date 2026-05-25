"use client";

import { Zap } from "lucide-react";

import { MetricCard } from "@/components/charts/MetricCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { CycleTimeData } from "@/types/org-summary";

// Insight banner is only shown once cycle-time data is dense enough
// to make a confident statement. Below this many merged PRs we still
// render the section but hide the headline.
const INSIGHT_MIN_MERGED = 50;

// Cutoffs for the "% merged within 24h" horizontal bar color ramp.
// Tuned so a repo that ships in a day most of the time reads green,
// "mixed" reads yellow, and slow repos read orange/red.
const FAST_GREEN_PCT = 0.8;
const MID_YELLOW_PCT = 0.65;
const SLOW_ORANGE_PCT = 0.5;

interface CycleTimeProps {
  data: CycleTimeData;
}

export function CycleTime({ data }: CycleTimeProps) {
  const { t } = useTranslation();
  const showInsight =
    data.totalPRsMerged >= INSIGHT_MIN_MERGED &&
    data.pctMergedWithin24h !== null;

  return (
    <section className="space-y-4">
      <div className="border-l-4 border-primary pl-3">
        <h2 className="text-lg font-medium">
          {t("dashboard.cycleTime.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.cycleTime.subtitle")}
        </p>
      </div>

      {showInsight && (
        <Card className="border-signal-green/30 bg-signal-green/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Zap className="mt-0.5 size-5 shrink-0 text-signal-yellow" />
            <p className="text-sm">
              {t("dashboard.cycleTime.insight", {
                pct: formatPct(data.pctMergedWithin24h),
                median: formatHoursAsDays(data.medianHours),
              })}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("dashboard.cycleTime.kpi.pctWithin24h")}
          value={formatPct(data.pctMergedWithin24h)}
        />
        <MetricCard
          label={t("dashboard.cycleTime.kpi.median")}
          value={formatHoursAsDays(data.medianHours)}
        />
        <MetricCard
          label={t("dashboard.cycleTime.kpi.mean")}
          value={formatHoursAsDays(data.meanHours)}
        />
        <MetricCard
          label={t("dashboard.cycleTime.kpi.p90")}
          value={formatHoursAsDays(data.p90Hours)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("dashboard.cycleTime.charts.ranking.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.cycleTime.charts.ranking.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankingChart rows={data.perRepo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("dashboard.cycleTime.charts.distribution.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.cycleTime.charts.distribution.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DistributionChart rows={data.perRepo} />
            <DistributionLegend />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

interface Row {
  name: string;
  merged: number;
  pctWithin24h: number;
  buckets: CycleTimeData["perRepo"][number]["buckets"];
}

function RankingChart({ rows }: { rows: Row[] }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div
          key={row.name}
          className="grid grid-cols-[100px_1fr_46px] items-center gap-2 text-xs"
        >
          <span
            className="truncate text-right text-muted-foreground"
            title={row.name}
          >
            {row.name}
          </span>
          <div className="h-4 overflow-hidden rounded-sm bg-muted">
            <div
              className={cn("h-full rounded-sm", rampClass(row.pctWithin24h))}
              style={{ width: `${Math.max(2, row.pctWithin24h * 100)}%` }}
              title={t("dashboard.cycleTime.tooltips.ranking", {
                merged: row.merged,
              })}
            />
          </div>
          <span className="text-right font-mono tabular-nums text-muted-foreground">
            {formatPct(row.pctWithin24h)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DistributionChart({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-1.5">
      {rows.map((row) => {
        const total =
          row.buckets.same_day +
          row.buckets.one_day +
          row.buckets.two_to_three_days +
          row.buckets.four_to_seven_days +
          row.buckets.seven_plus_days;
        if (total === 0) return null;
        const pct = (n: number) => (n / total) * 100;
        return (
          <div
            key={row.name}
            className="grid grid-cols-[100px_1fr] items-center gap-2 text-xs"
          >
            <span
              className="truncate text-right text-muted-foreground"
              title={row.name}
            >
              {row.name}
            </span>
            <div className="flex h-4 w-full overflow-hidden rounded-sm bg-muted">
              {row.buckets.same_day > 0 && (
                <span
                  className="h-full bg-bucket-same-day"
                  style={{ width: `${pct(row.buckets.same_day)}%` }}
                />
              )}
              {row.buckets.one_day > 0 && (
                <span
                  className="h-full bg-bucket-one-day"
                  style={{ width: `${pct(row.buckets.one_day)}%` }}
                />
              )}
              {row.buckets.two_to_three_days > 0 && (
                <span
                  className="h-full bg-bucket-two-three"
                  style={{ width: `${pct(row.buckets.two_to_three_days)}%` }}
                />
              )}
              {row.buckets.four_to_seven_days > 0 && (
                <span
                  className="h-full bg-bucket-four-seven"
                  style={{ width: `${pct(row.buckets.four_to_seven_days)}%` }}
                />
              )}
              {row.buckets.seven_plus_days > 0 && (
                <span
                  className="h-full bg-bucket-seven-plus"
                  style={{ width: `${pct(row.buckets.seven_plus_days)}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DistributionLegend() {
  const { t } = useTranslation();
  const items = [
    { key: "sameDay", className: "bg-bucket-same-day" },
    { key: "oneDay", className: "bg-bucket-one-day" },
    { key: "twoThree", className: "bg-bucket-two-three" },
    { key: "fourSeven", className: "bg-bucket-four-seven" },
    { key: "sevenPlus", className: "bg-bucket-seven-plus" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.key} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", i.className)} />
          {t(`dashboard.cycleTime.buckets.${i.key}`)}
        </span>
      ))}
    </div>
  );
}

function rampClass(pct: number): string {
  if (pct >= FAST_GREEN_PCT) return "bg-signal-green";
  if (pct >= MID_YELLOW_PCT) return "bg-bucket-one-day"; // lime/green
  if (pct >= SLOW_ORANGE_PCT) return "bg-signal-yellow";
  return "bg-bucket-four-seven"; // orange — slow repo
}

function formatPct(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function formatHoursAsDays(hours: number | null): string {
  if (hours === null || hours === undefined) return "—";
  const days = hours / 24;
  if (days < 1) return `${hours.toFixed(0)} h`;
  const rounded = Math.round(days * 10) / 10;
  // Show "5 dias" not "5,0 dias" when the value is integral.
  const label = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(1).replace(".", ",");
  return `${label} d`;
}
