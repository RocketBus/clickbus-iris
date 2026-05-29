"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

import { MetricLineChart } from "@/components/charts/MetricLineChart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { TimeSeriesPoint, AIImpactPoint } from "@/types/temporal";

interface PayloadInsights {
  intentDistribution?: Record<string, number>;
  originDistribution?: Record<string, number>;
  stabilizationByOrigin?: Record<
    string,
    { stabilization_ratio: number; files_touched: number }
  >;
  cascadeRate?: number;
  cascadeMedianDepth?: number;
  cascadeByOrigin?: Record<
    string,
    { cascade_rate: number; cascades: number; total_commits: number }
  >;
  durabilityByOrigin?: Record<
    string,
    {
      survival_rate: number;
      lines_introduced: number;
      lines_surviving: number;
      median_age_days: number;
    }
  >;
  activityTimeline?: Array<{
    week_start: string;
    commits: number;
    lines_changed: number;
    intent?: Record<string, number>;
    origin?: Record<string, number>;
  }>;
  flowLoad?: Array<{
    bucket: string;
    bucket_start: string;
    bucket_end: string;
    wip_total: number;
    wip_by_intent: Partial<Record<string, number>>;
    author_concurrency: number;
  }>;
  flowEfficiencyMedian?: number;
  flowEfficiencyByIntent?: Partial<Record<string, number>>;
  timeInPhaseMedianHours?: Partial<Record<string, number>>;
  medianTimeToFirstReviewHours?: number;
  humanReviewCoveragePct?: number;
  humanApprovalCoveragePct?: number;
  humanReviewCoverageByIntent?: Partial<Record<string, number>>;
  humanReviewCoverageByOriginOfPr?: Partial<Record<string, number>>;
}

interface RepoChartsProps {
  timeSeries: TimeSeriesPoint[];
  insights: PayloadInsights;
  aiImpact?: AIImpactPoint[];
}

const intentColors: Record<string, string> = {
  FEATURE: "bg-signal-purple",
  FIX: "bg-signal-yellow",
  REFACTOR: "bg-primary",
  CONFIG: "bg-muted-foreground",
  UNKNOWN: "bg-signal-gray",
};

function DistributionBar({
  data,
  labels,
  colors,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const order = Object.keys(labels);

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full">
        {order.map((key) => {
          const value = data[key] ?? 0;
          if (value === 0) return null;
          const pct = (value / total) * 100;
          return (
            <div
              key={key}
              className={cn("h-full", colors[key] ?? "bg-muted")}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {order.map((key) => {
          const value = data[key] ?? 0;
          if (value === 0) return null;
          const pct = ((value / total) * 100).toFixed(0);
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className={cn("size-2 rounded-full", colors[key] ?? "bg-muted")}
              />
              <span>
                {labels[key] ?? key} {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

function ComparisonChart({
  data,
  humanKey,
  aiKey,
  title,
  description,
  humanLabel,
  aiLabel,
  format = "pct",
}: {
  data: AIImpactPoint[];
  humanKey: keyof AIImpactPoint;
  aiKey: keyof AIImpactPoint;
  title: string;
  description: string;
  humanLabel: string;
  aiLabel: string;
  format?: "pct" | "number";
}) {
  const hasData = data.some((p) => p[humanKey] !== null || p[aiKey] !== null);
  if (!hasData) return null;

  const formatValue = (v: number) =>
    format === "pct" ? `${(v * 100).toFixed(0)}%` : v.toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={38}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                fontSize: 12,
              }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value, name) => [
                formatValue(Number(value)),
                String(name) === humanKey ? humanLabel : aiLabel,
              ]}
            />
            <Legend
              formatter={(value) => (value === humanKey ? humanLabel : aiLabel)}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey={humanKey}
              stroke="var(--color-muted-foreground)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey={aiKey}
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const FLOW_LOAD_INTENT_ORDER = [
  "FEATURE",
  "FIX",
  "REFACTOR",
  "CONFIG",
  "UNKNOWN",
] as const;

const FLOW_LOAD_INTENT_COLORS: Record<string, string> = {
  FEATURE: "var(--color-signal-purple)",
  FIX: "var(--color-signal-yellow)",
  REFACTOR: "var(--color-signal-green)",
  CONFIG: "var(--color-muted-foreground)",
  UNKNOWN: "var(--color-signal-gray)",
};

function FlowLoadCard({
  data,
  title,
  subtitle,
  wipAxisLabel,
  authorsAxisLabel,
  authorsLineLabel,
  intentLabels,
}: {
  data: NonNullable<PayloadInsights["flowLoad"]>;
  title: string;
  subtitle: string;
  wipAxisLabel: string;
  authorsAxisLabel: string;
  authorsLineLabel: string;
  intentLabels: Record<string, string>;
}) {
  if (data.length < 2) return null;

  const chartData = data.map((b) => {
    const intent = b.wip_by_intent ?? {};
    return {
      bucket: b.bucket,
      FEATURE: intent.FEATURE ?? 0,
      FIX: intent.FIX ?? 0,
      REFACTOR: intent.REFACTOR ?? 0,
      CONFIG: intent.CONFIG ?? 0,
      UNKNOWN: intent.UNKNOWN ?? 0,
      author_concurrency: b.author_concurrency,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              yAxisId="wip"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={38}
              label={{
                value: wipAxisLabel,
                angle: -90,
                position: "insideLeft",
                style: {
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                  textAnchor: "middle",
                },
              }}
            />
            <YAxis
              yAxisId="authors"
              orientation="right"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={38}
              label={{
                value: authorsAxisLabel,
                angle: 90,
                position: "insideRight",
                style: {
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                  textAnchor: "middle",
                },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const key = String(name);
                if (key === "author_concurrency") {
                  return [Number(value), authorsLineLabel];
                }
                return [Number(value), intentLabels[key] ?? key];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                const key = String(value);
                if (key === "author_concurrency") return authorsLineLabel;
                return intentLabels[key] ?? key;
              }}
            />
            {FLOW_LOAD_INTENT_ORDER.map((intent) => (
              <Area
                key={intent}
                yAxisId="wip"
                type="monotone"
                dataKey={intent}
                stackId="wip"
                fill={FLOW_LOAD_INTENT_COLORS[intent]}
                fillOpacity={0.55}
                stroke={FLOW_LOAD_INTENT_COLORS[intent]}
                strokeWidth={1}
              />
            ))}
            <Line
              yAxisId="authors"
              type="monotone"
              dataKey="author_concurrency"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={{ r: 2, fill: "var(--color-foreground)" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const FLOW_EFF_PHASE_ORDER = [
  "coding",
  "awaiting_first_review",
  "in_review_active",
  "in_review_wait",
  "awaiting_merge",
] as const;

const FLOW_EFF_PHASE_COLORS: Record<string, string> = {
  coding: "bg-signal-green",
  awaiting_first_review: "bg-signal-yellow",
  in_review_active: "bg-signal-purple",
  in_review_wait: "bg-signal-red",
  awaiting_merge: "bg-signal-gray",
};

function FlowEfficiencyCard({
  median,
  byIntent,
  timeInPhase,
  ttfrHours,
  title,
  subtitle,
  efficiencyLabel,
  ttfrLabel,
  ttfrUnit,
  phaseLabels,
  byIntentTitle,
  intentLabels,
}: {
  median: number;
  byIntent: Partial<Record<string, number>> | undefined;
  timeInPhase: Partial<Record<string, number>>;
  ttfrHours: number | undefined;
  title: string;
  subtitle: string;
  efficiencyLabel: string;
  ttfrLabel: string;
  ttfrUnit: string;
  phaseLabels: Record<string, string>;
  byIntentTitle: string;
  intentLabels: Record<string, string>;
}) {
  const totalHours = FLOW_EFF_PHASE_ORDER.reduce(
    (sum, key) => sum + (timeInPhase[key] ?? 0),
    0,
  );

  const byIntentEntries = byIntent
    ? Object.entries(byIntent).filter(([, v]) => typeof v === "number")
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {efficiencyLabel}
            </div>
            <div className="mt-1 font-mono text-3xl font-bold text-signal-green">
              {(median * 100).toFixed(0)}%
            </div>
          </div>
          {ttfrHours != null && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {ttfrLabel}
              </div>
              <div className="mt-1 font-mono text-3xl font-bold">
                {ttfrHours.toFixed(1)}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  {ttfrUnit}
                </span>
              </div>
            </div>
          )}
        </div>

        {totalHours > 0 && (
          <div className="space-y-3">
            <div className="flex h-3 overflow-hidden rounded-full">
              {FLOW_EFF_PHASE_ORDER.map((key) => {
                const hours = timeInPhase[key] ?? 0;
                if (hours === 0) return null;
                const pct = (hours / totalHours) * 100;
                return (
                  <div
                    key={key}
                    className={cn(
                      "h-full",
                      FLOW_EFF_PHASE_COLORS[key] ?? "bg-muted-foreground/40",
                    )}
                    style={{ width: `${pct}%` }}
                    title={`${phaseLabels[key] ?? key}: ${hours.toFixed(1)}h`}
                  />
                );
              })}
            </div>
            <div className="grid gap-1 text-xs">
              {FLOW_EFF_PHASE_ORDER.map((key) => {
                const hours = timeInPhase[key] ?? 0;
                if (hours === 0) return null;
                const pct = (hours / totalHours) * 100;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b border-border/40 py-1"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block size-2 rounded-full",
                          FLOW_EFF_PHASE_COLORS[key] ??
                            "bg-muted-foreground/40",
                        )}
                      />
                      {phaseLabels[key] ?? key}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {hours.toFixed(1)}h ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {byIntentEntries.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {byIntentTitle}
            </div>
            <div className="grid gap-1 text-xs">
              {byIntentEntries.map(([intent, value]) => (
                <div
                  key={intent}
                  className="flex items-center justify-between border-b border-border/40 py-1"
                >
                  <span>{intentLabels[intent] ?? intent}</span>
                  <span className="font-mono text-muted-foreground">
                    {((value as number) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CoverageBreakdown({
  title,
  entries,
  labels,
}: {
  title: string;
  entries: [string, number][];
  labels: Record<string, string>;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2 pt-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-1 text-xs">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-border/40 py-1"
          >
            <span>{labels[key] ?? key}</span>
            <span className="font-mono text-muted-foreground">
              {(value * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HumanReviewCoverageCard({
  reviewPct,
  approvalPct,
  byOrigin,
  byIntent,
  title,
  subtitle,
  reviewLabel,
  approvalLabel,
  byOriginTitle,
  byIntentTitle,
  originLabels,
  intentLabels,
}: {
  reviewPct: number;
  approvalPct: number | undefined;
  byOrigin: Partial<Record<string, number>> | undefined;
  byIntent: Partial<Record<string, number>> | undefined;
  title: string;
  subtitle: string;
  reviewLabel: string;
  approvalLabel: string;
  byOriginTitle: string;
  byIntentTitle: string;
  originLabels: Record<string, string>;
  intentLabels: Record<string, string>;
}) {
  const numberEntries = (
    rec: Partial<Record<string, number>> | undefined,
  ): [string, number][] =>
    rec
      ? (Object.entries(rec).filter(([, v]) => typeof v === "number") as [
          string,
          number,
        ][])
      : [];

  // Low real-human-review coverage is the alarming case — color the headline
  // metric so a kody-only pipeline stands out at a glance.
  const reviewColor = reviewPct < 0.5 ? "text-signal-red" : "text-signal-green";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {reviewLabel}
            </div>
            <div
              className={cn("mt-1 font-mono text-3xl font-bold", reviewColor)}
            >
              {(reviewPct * 100).toFixed(0)}%
            </div>
          </div>
          {approvalPct != null && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {approvalLabel}
              </div>
              <div className="mt-1 font-mono text-3xl font-bold">
                {(approvalPct * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        <CoverageBreakdown
          title={byOriginTitle}
          entries={numberEntries(byOrigin)}
          labels={originLabels}
        />
        <CoverageBreakdown
          title={byIntentTitle}
          entries={numberEntries(byIntent)}
          labels={intentLabels}
        />
      </CardContent>
    </Card>
  );
}

function CommitMixChart({
  data,
  title,
  description,
  humanLabel,
  aiLabel,
}: {
  data: AIImpactPoint[];
  title: string;
  description: string;
  humanLabel: string;
  aiLabel: string;
}) {
  const hasData = data.some(
    (p) => p.commits_human !== null || p.commits_ai !== null,
  );
  if (!hasData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={38}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                fontSize: 12,
              }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value, name) => [
                Number(value).toFixed(0),
                String(name) === "commits_human" ? humanLabel : aiLabel,
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "commits_human" ? humanLabel : aiLabel
              }
              wrapperStyle={{ fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="commits_human"
              stackId="1"
              fill="var(--color-muted-foreground)"
              fillOpacity={0.3}
              stroke="var(--color-muted-foreground)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="commits_ai"
              stackId="1"
              fill="var(--color-primary)"
              fillOpacity={0.3}
              stroke="var(--color-primary)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RepoCharts({
  timeSeries,
  insights,
  aiImpact,
}: RepoChartsProps) {
  const { t, language } = useTranslation();
  const intentLabels: Record<string, string> = {
    FEATURE: t("repoCharts.intent.labels.feature"),
    FIX: t("repoCharts.intent.labels.fix"),
    REFACTOR: t("repoCharts.intent.labels.refactor"),
    CONFIG: t("repoCharts.intent.labels.config"),
    UNKNOWN: t("repoCharts.intent.labels.unknown"),
  };
  const originLabels: Record<string, string> = {
    HUMAN: t("repoCharts.origin.labels.human"),
    AI_ASSISTED: t("repoCharts.origin.labels.ai"),
    BOT: t("repoCharts.origin.labels.bot"),
  };
  const numberLocale = language === "pt-BR" ? "pt-BR" : "en-US";

  const chartData = timeSeries.map((p) => ({
    date: p.date,
    stabilization_ratio: p.stabilization_ratio,
    revert_rate: p.revert_rate,
    churn_events: p.churn_events,
    commits_total: p.commits_total,
    ai_detection_coverage_pct: p.ai_detection_coverage_pct,
    cascade_rate: p.cascade_rate,
  }));

  const hasAI = timeSeries.some(
    (p) =>
      p.ai_detection_coverage_pct != null && p.ai_detection_coverage_pct > 0,
  );

  return (
    <div className="space-y-4">
      {/* Primary: Stabilization trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t("repoCharts.stabilization.title")}</CardTitle>
          <CardDescription>
            {t("repoCharts.stabilization.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetricLineChart
            data={chartData}
            dataKey="stabilization_ratio"
            label={t("repoCharts.stabilization.label")}
            color="var(--color-signal-purple)"
            format="pct"
            height={240}
          />
        </CardContent>
      </Card>

      {/* Intent + Origin distribution */}
      <div
        className={cn(
          "grid gap-4",
          insights.intentDistribution && insights.originDistribution
            ? "md:grid-cols-2"
            : "md:grid-cols-1",
        )}
      >
        {insights.intentDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>{t("repoCharts.intent.title")}</CardTitle>
              <CardDescription>
                {t("repoCharts.intent.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionBar
                data={insights.intentDistribution}
                labels={intentLabels}
                colors={intentColors}
              />
              <div className="mt-3 space-y-1">
                {Object.entries(insights.intentDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {intentLabels[key] ?? key}
                      </span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.originDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>{t("repoCharts.origin.title")}</CardTitle>
              <CardDescription>
                {t("repoCharts.origin.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionBar
                data={insights.originDistribution}
                labels={originLabels}
                colors={{
                  HUMAN: "bg-muted-foreground",
                  AI_ASSISTED: "bg-primary",
                  BOT: "bg-signal-gray",
                }}
              />
              {insights.stabilizationByOrigin && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("repoCharts.origin.stabByOrigin")}
                  </p>
                  <div className="space-y-1">
                    {Object.entries(insights.stabilizationByOrigin).map(
                      ([origin, data]) => (
                        <div
                          key={origin}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {originLabels[origin] ?? origin}
                          </span>
                          <span className="font-mono">
                            {(data.stabilization_ratio * 100).toFixed(0)}%
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Secondary charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("repoCharts.churn.title")}</CardTitle>
            <CardDescription>{t("repoCharts.churn.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricLineChart
              data={chartData}
              dataKey="churn_events"
              label={t("repoCharts.churn.label")}
              color="var(--color-signal-yellow)"
              format="number"
              height={180}
            />
          </CardContent>
        </Card>

        {hasAI ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("repoCharts.aiAdoption.title")}</CardTitle>
              <CardDescription>
                {t("repoCharts.aiAdoption.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetricLineChart
                data={chartData}
                dataKey="ai_detection_coverage_pct"
                label={t("repoCharts.aiAdoption.label")}
                color="var(--color-primary)"
                format="pct_raw"
                height={180}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("repoCharts.commits.title")}</CardTitle>
              <CardDescription>
                {t("repoCharts.commits.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetricLineChart
                data={chartData}
                dataKey="commits_total"
                label={t("repoCharts.commits.label")}
                color="var(--color-muted-foreground)"
                format="number"
                height={180}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Correction Cascades + Code Durability */}
      {(insights.cascadeRate != null || insights.durabilityByOrigin) && (
        <div
          className={cn(
            "grid gap-4",
            insights.cascadeRate != null && insights.durabilityByOrigin
              ? "md:grid-cols-2"
              : "md:grid-cols-1",
          )}
        >
          {insights.cascadeRate != null && (
            <Card>
              <CardHeader>
                <CardTitle>{t("repoCharts.cascades.title")}</CardTitle>
                <CardDescription>
                  {t("repoCharts.cascades.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("repoCharts.cascades.rate")}
                  </span>
                  <span className="font-mono">
                    {(insights.cascadeRate * 100).toFixed(0)}%
                  </span>
                </div>
                {insights.cascadeMedianDepth != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("repoCharts.cascades.medianDepth")}
                    </span>
                    <span className="font-mono">
                      {t("repoCharts.cascades.depthFixes", {
                        value: insights.cascadeMedianDepth.toFixed(1),
                      })}
                    </span>
                  </div>
                )}
                {insights.cascadeByOrigin &&
                  Object.entries(insights.cascadeByOrigin).map(
                    ([origin, data]) => (
                      <div
                        key={origin}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {originLabels[origin] ?? origin}
                        </span>
                        <span className="font-mono">
                          {t("repoCharts.cascades.byOrigin", {
                            pct: (data.cascade_rate * 100).toFixed(0),
                            cascades: data.cascades,
                            total: data.total_commits,
                          })}
                        </span>
                      </div>
                    ),
                  )}
              </CardContent>
            </Card>
          )}

          {insights.durabilityByOrigin && (
            <Card>
              <CardHeader>
                <CardTitle>{t("repoCharts.durability.title")}</CardTitle>
                <CardDescription>
                  {t("repoCharts.durability.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(insights.durabilityByOrigin).map(
                  ([origin, data]) => (
                    <div key={origin} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {originLabels[origin] ?? origin}
                        </span>
                        <span className="font-mono">
                          {t("repoCharts.durability.survival", {
                            pct: (data.survival_rate * 100).toFixed(0),
                          })}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>
                          {t("repoCharts.durability.introduced", {
                            count:
                              data.lines_introduced.toLocaleString(
                                numberLocale,
                              ),
                          })}
                        </span>
                        <span>
                          {t("repoCharts.durability.surviving", {
                            count:
                              data.lines_surviving.toLocaleString(numberLocale),
                          })}
                        </span>
                        <span>
                          {t("repoCharts.durability.medianAge", {
                            days: data.median_age_days.toFixed(0),
                          })}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Activity timeline */}
      {insights.activityTimeline && insights.activityTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("repoCharts.weeklyActivity.title")}</CardTitle>
            <CardDescription>
              {t("repoCharts.weeklyActivity.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4">
                      {t("repoCharts.weeklyActivity.columns.week")}
                    </th>
                    <th className="pb-2 pr-4">
                      {t("repoCharts.weeklyActivity.columns.commits")}
                    </th>
                    <th className="pb-2 pr-4">
                      {t("repoCharts.weeklyActivity.columns.loc")}
                    </th>
                    <th className="pb-2 pr-4">
                      {t("repoCharts.weeklyActivity.columns.feature")}
                    </th>
                    <th className="pb-2 pr-4">
                      {t("repoCharts.weeklyActivity.columns.fix")}
                    </th>
                    <th className="pb-2">
                      {t("repoCharts.weeklyActivity.columns.aiPct")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.activityTimeline.map((w) => {
                    const intent = w.intent ?? {};
                    const totalIntent =
                      Object.values(intent).reduce((a, b) => a + b, 0) || 1;
                    const origin = w.origin ?? {};
                    const totalOrigin =
                      Object.values(origin).reduce((a, b) => a + b, 0) || 1;
                    return (
                      <tr
                        key={w.week_start}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 pr-4">{w.week_start.slice(5)}</td>
                        <td className="py-2 pr-4">{w.commits}</td>
                        <td className="py-2 pr-4">
                          {w.lines_changed.toLocaleString(numberLocale)}
                        </td>
                        <td className="py-2 pr-4">
                          {(
                            ((intent.FEATURE ?? 0) / totalIntent) *
                            100
                          ).toFixed(0)}
                          %
                        </td>
                        <td className="py-2 pr-4">
                          {(((intent.FIX ?? 0) / totalIntent) * 100).toFixed(0)}
                          %
                        </td>
                        <td className="py-2">
                          {(
                            ((origin.AI_ASSISTED ?? 0) / totalOrigin) *
                            100
                          ).toFixed(0)}
                          %
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flow Efficiency — active vs wait of merged-PR lifecycle */}
      {insights.flowEfficiencyMedian != null &&
        insights.timeInPhaseMedianHours && (
          <FlowEfficiencyCard
            median={insights.flowEfficiencyMedian}
            byIntent={insights.flowEfficiencyByIntent}
            timeInPhase={insights.timeInPhaseMedianHours}
            ttfrHours={insights.medianTimeToFirstReviewHours}
            title={t("repoCharts.flowEfficiency.title")}
            subtitle={t("repoCharts.flowEfficiency.subtitle")}
            efficiencyLabel={t("repoCharts.flowEfficiency.efficiencyLabel")}
            ttfrLabel={t("repoCharts.flowEfficiency.ttfrLabel")}
            ttfrUnit={t("repoCharts.flowEfficiency.ttfrUnit")}
            phaseLabels={{
              coding: t("repoCharts.flowEfficiency.phaseLabels.coding"),
              awaiting_first_review: t(
                "repoCharts.flowEfficiency.phaseLabels.awaiting_first_review",
              ),
              in_review_active: t(
                "repoCharts.flowEfficiency.phaseLabels.in_review_active",
              ),
              in_review_wait: t(
                "repoCharts.flowEfficiency.phaseLabels.in_review_wait",
              ),
              awaiting_merge: t(
                "repoCharts.flowEfficiency.phaseLabels.awaiting_merge",
              ),
            }}
            byIntentTitle={t("repoCharts.flowEfficiency.byIntentTitle")}
            intentLabels={intentLabels}
          />
        )}

      {/* Human Review Coverage — share of merged PRs a human actually reviewed */}
      {insights.humanReviewCoveragePct != null && (
        <HumanReviewCoverageCard
          reviewPct={insights.humanReviewCoveragePct}
          approvalPct={insights.humanApprovalCoveragePct}
          byOrigin={insights.humanReviewCoverageByOriginOfPr}
          byIntent={insights.humanReviewCoverageByIntent}
          title={t("repoCharts.humanReviewCoverage.title")}
          subtitle={t("repoCharts.humanReviewCoverage.subtitle")}
          reviewLabel={t("repoCharts.humanReviewCoverage.reviewLabel")}
          approvalLabel={t("repoCharts.humanReviewCoverage.approvalLabel")}
          byOriginTitle={t("repoCharts.humanReviewCoverage.byOriginTitle")}
          byIntentTitle={t("repoCharts.humanReviewCoverage.byIntentTitle")}
          originLabels={originLabels}
          intentLabels={intentLabels}
        />
      )}

      {/* Flow Load — WIP per ISO week + author concurrency */}
      {insights.flowLoad && insights.flowLoad.length >= 2 && (
        <FlowLoadCard
          data={insights.flowLoad}
          title={t("repoCharts.flowLoad.title")}
          subtitle={t("repoCharts.flowLoad.subtitle")}
          wipAxisLabel={t("repoCharts.flowLoad.wipAxis")}
          authorsAxisLabel={t("repoCharts.flowLoad.authorsAxis")}
          authorsLineLabel={t("repoCharts.flowLoad.authorsLine")}
          intentLabels={{
            FEATURE: t("repoCharts.flowLoad.intentLabels.FEATURE"),
            FIX: t("repoCharts.flowLoad.intentLabels.FIX"),
            REFACTOR: t("repoCharts.flowLoad.intentLabels.REFACTOR"),
            CONFIG: t("repoCharts.flowLoad.intentLabels.CONFIG"),
            UNKNOWN: t("repoCharts.flowLoad.intentLabels.UNKNOWN"),
          }}
        />
      )}

      {/* AI Impact — temporal comparison of Human vs AI-assisted code */}
      {aiImpact && aiImpact.length >= 2 && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-medium">
              {t("repoCharts.aiImpact.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("repoCharts.aiImpact.subtitle")}
            </p>
          </div>

          <CommitMixChart
            data={aiImpact}
            title={t("repoCharts.commitMix.title")}
            description={t("repoCharts.commitMix.subtitle")}
            humanLabel={t("repoCharts.commitMix.human")}
            aiLabel={t("repoCharts.commitMix.ai")}
          />

          <div className="grid gap-4 md:grid-cols-2 [&>:only-child]:md:col-span-2">
            <ComparisonChart
              data={aiImpact}
              humanKey="stabilization_human"
              aiKey="stabilization_ai"
              title={t("repoCharts.compare.stabilizationTitle")}
              description={t("repoCharts.compare.stabilizationSubtitle")}
              humanLabel={t("repoCharts.commitMix.human")}
              aiLabel={t("repoCharts.commitMix.ai")}
            />
            <ComparisonChart
              data={aiImpact}
              humanKey="durability_human"
              aiKey="durability_ai"
              title={t("repoCharts.compare.durabilityTitle")}
              description={t("repoCharts.compare.durabilitySubtitle")}
              humanLabel={t("repoCharts.commitMix.human")}
              aiLabel={t("repoCharts.commitMix.ai")}
            />
          </div>

          <ComparisonChart
            data={aiImpact}
            humanKey="cascade_human"
            aiKey="cascade_ai"
            title={t("repoCharts.compare.cascadesTitle")}
            description={t("repoCharts.compare.cascadesSubtitle")}
            humanLabel={t("repoCharts.commitMix.human")}
            aiLabel={t("repoCharts.commitMix.ai")}
          />
        </>
      )}
    </div>
  );
}
