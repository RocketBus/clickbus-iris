"use client";

import { useMemo, useState } from "react";

import { Sparkline } from "@/components/charts/Sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { RepoSummary } from "@/types/temporal";
import { healthIndicator } from "@/types/temporal";

interface CompareViewProps {
  repos: RepoSummary[];
}

const healthColors: Record<string, string> = {
  green: "text-signal-purple",
  yellow: "text-signal-yellow",
  red: "text-signal-red",
  gray: "text-muted-foreground",
};

type MetricFormat = "pct" | "number" | "rate";

// Columns the table can be sorted by. `name` and `health` are non-numeric;
// the rest map directly to numeric RepoSummary fields.
type SortKey =
  | "name"
  | "stabilization_ratio"
  | "revert_rate"
  | "churn_events"
  | "commits_total"
  | "ai_detection_coverage_pct"
  | "health";

type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

// Ordering for the categorical health field: best first.
const healthRank: Record<RepoSummary["health"], number> = {
  healthy: 0,
  warning: 1,
  critical: 2,
  unknown: 3,
};

// String columns read best ascending (A→Z, healthy→unknown); numbers default
// to descending (highest first) so the first click surfaces the extreme.
function defaultDir(key: SortKey): SortDir {
  return key === "name" || key === "health" ? "asc" : "desc";
}

function sortValue(repo: RepoSummary, key: SortKey): number | string | null {
  if (key === "name") return repo.name.toLowerCase();
  if (key === "health") return healthRank[repo.health];
  return repo[key];
}

function formatMetric(value: number, format: MetricFormat): string {
  switch (format) {
    case "pct":
      return `${(value * 100).toFixed(0)}%`;
    case "rate":
      return `${(value * 100).toFixed(1)}%`;
    case "number":
      return value.toFixed(0);
  }
}

function metricClass(
  value: number | null,
  best: number | null | undefined,
  worst: number | null | undefined,
): string {
  if (value === null) return "";
  if (best !== null && best !== undefined && value === best)
    return "text-signal-purple";
  if (worst !== null && worst !== undefined && value === worst)
    return "text-signal-red";
  return "";
}

function MetricCell({
  value,
  format = "pct",
  best,
  worst,
}: {
  value: number | null;
  format?: MetricFormat;
  invert?: boolean;
  best?: number | null;
  worst?: number | null;
}) {
  if (value === null)
    return <td className="px-3 py-2 text-muted-foreground">{"—"}</td>;

  return (
    <td
      className={cn(
        "px-3 py-2 font-mono text-sm",
        metricClass(value, best, worst),
      )}
    >
      {formatMetric(value, format)}
    </td>
  );
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      className={cn("pb-2 px-3", className)}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 select-none transition-colors hover:text-foreground"
      >
        {label}
        <span
          className={cn(
            "text-[9px] leading-none",
            active ? "opacity-100" : "opacity-25",
          )}
        >
          {active && sort.dir === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

function MetricStat({
  label,
  value,
  format = "pct",
  best,
  worst,
}: {
  label: string;
  value: number | null;
  format?: MetricFormat;
  best?: number | null;
  worst?: number | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("font-mono text-sm", metricClass(value, best, worst))}
      >
        {value === null ? "—" : formatMetric(value, format)}
      </span>
    </div>
  );
}

export function CompareView({ repos }: CompareViewProps) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<SortState>({
    key: "stabilization_ratio",
    dir: "desc",
  });

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: defaultDir(key) },
    );
  }

  // Best/worst highlights are independent of the chosen sort — they reflect the
  // extreme across the whole set.
  const allStab = repos
    .map((r) => r.stabilization_ratio)
    .filter((v): v is number => v !== null);
  const bestStab = allStab.length > 0 ? Math.max(...allStab) : null;
  const worstStab = allStab.length > 1 ? Math.min(...allStab) : null;

  const allChurn = repos
    .map((r) => r.churn_events)
    .filter((v): v is number => v !== null);
  const bestChurn = allChurn.length > 0 ? Math.min(...allChurn) : null;
  const worstChurn = allChurn.length > 1 ? Math.max(...allChurn) : null;

  const allRevert = repos
    .map((r) => r.revert_rate)
    .filter((v): v is number => v !== null);
  const bestRevert = allRevert.length > 0 ? Math.min(...allRevert) : null;
  const worstRevert = allRevert.length > 1 ? Math.max(...allRevert) : null;

  const allAI = repos
    .map((r) => r.ai_detection_coverage_pct)
    .filter((v): v is number => v !== null && v > 0);
  const hasAnyAI = allAI.length > 0;

  const sorted = useMemo(() => {
    const arr = [...repos];
    arr.sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      // Missing values always sink to the bottom, regardless of direction.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp =
        typeof av === "string" && typeof bv === "string"
          ? av.localeCompare(bv)
          : (av as number) - (bv as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [repos, sort]);

  if (repos.length === 0) {
    return (
      <div className="rounded-md border border-border p-8 text-center text-sm text-muted-foreground">
        {t("compare.empty")}
      </div>
    );
  }

  // Mobile dropdown options mirror the sortable table columns.
  const mobileSortOptions: { key: SortKey; label: string }[] = [
    { key: "name", label: t("compare.columns.repository") },
    { key: "stabilization_ratio", label: t("compare.columns.stabilization") },
    { key: "revert_rate", label: t("compare.columns.revertRate") },
    { key: "churn_events", label: t("compare.columns.churn") },
    { key: "commits_total", label: t("compare.columns.commits") },
    ...(hasAnyAI
      ? [
          {
            key: "ai_detection_coverage_pct" as SortKey,
            label: t("compare.columns.ai"),
          },
        ]
      : []),
    { key: "health", label: t("compare.columns.health") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("compare.ranking")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop / tablet: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3">#</th>
                <SortableHeader
                  label={t("compare.columns.repository")}
                  sortKey="name"
                  sort={sort}
                  onSort={handleSort}
                  className="pl-0"
                />
                <SortableHeader
                  label={t("compare.columns.stabilization")}
                  sortKey="stabilization_ratio"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("compare.columns.revertRate")}
                  sortKey="revert_rate"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("compare.columns.churn")}
                  sortKey="churn_events"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("compare.columns.commits")}
                  sortKey="commits_total"
                  sort={sort}
                  onSort={handleSort}
                />
                {hasAnyAI && (
                  <SortableHeader
                    label={t("compare.columns.ai")}
                    sortKey="ai_detection_coverage_pct"
                    sort={sort}
                    onSort={handleSort}
                  />
                )}
                <th className="pb-2 px-3">{t("compare.columns.trend")}</th>
                <SortableHeader
                  label={t("compare.columns.health")}
                  sortKey="health"
                  sort={sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {sorted.map((repo, i) => {
                const color = healthIndicator(repo.health);
                return (
                  <tr key={repo.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="font-mono text-sm">{repo.name}</span>
                    </td>
                    <MetricCell
                      value={repo.stabilization_ratio}
                      format="pct"
                      best={bestStab}
                      worst={worstStab}
                    />
                    <MetricCell
                      value={repo.revert_rate}
                      format="rate"
                      invert
                      best={bestRevert}
                      worst={worstRevert}
                    />
                    <MetricCell
                      value={repo.churn_events}
                      format="number"
                      invert
                      best={bestChurn}
                      worst={worstChurn}
                    />
                    <MetricCell value={repo.commits_total} format="number" />
                    {hasAnyAI && (
                      <td className="px-3 py-2 font-mono text-sm text-primary">
                        {repo.ai_detection_coverage_pct != null &&
                        repo.ai_detection_coverage_pct > 0
                          ? `${repo.ai_detection_coverage_pct < 10 ? repo.ai_detection_coverage_pct.toFixed(1) : repo.ai_detection_coverage_pct.toFixed(0)}%`
                          : "—"}
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <Sparkline data={repo.sparkline} />
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-sm font-medium",
                        healthColors[color],
                      )}
                    >
                      {repo.health}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile: sort control + card stack */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <label
              htmlFor="compare-sort"
              className="text-xs text-muted-foreground"
            >
              {t("compare.sortBy")}
            </label>
            <select
              id="compare-sort"
              value={sort.key}
              onChange={(e) => handleSort(e.target.value as SortKey)}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              {mobileSortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                setSort((prev) => ({
                  ...prev,
                  dir: prev.dir === "asc" ? "desc" : "asc",
                }))
              }
              className="rounded-md border border-border px-2 py-1.5 text-sm"
              aria-label={sort.dir === "asc" ? "ascending" : "descending"}
            >
              {sort.dir === "asc" ? "▲" : "▼"}
            </button>
          </div>

          <ul className="flex flex-col gap-3">
            {sorted.map((repo, i) => {
              const color = healthIndicator(repo.health);
              return (
                <li
                  key={repo.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="truncate font-mono text-sm">
                        {repo.name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "flex-shrink-0 text-xs font-medium capitalize",
                        healthColors[color],
                      )}
                    >
                      {repo.health}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <MetricStat
                      label={t("compare.columns.stabilization")}
                      value={repo.stabilization_ratio}
                      format="pct"
                      best={bestStab}
                      worst={worstStab}
                    />
                    <MetricStat
                      label={t("compare.mobile.revertRate")}
                      value={repo.revert_rate}
                      format="rate"
                      best={bestRevert}
                      worst={worstRevert}
                    />
                    <MetricStat
                      label={t("compare.columns.churn")}
                      value={repo.churn_events}
                      format="number"
                      best={bestChurn}
                      worst={worstChurn}
                    />
                    <MetricStat
                      label={t("compare.columns.commits")}
                      value={repo.commits_total}
                      format="number"
                    />
                    {hasAnyAI && (
                      <MetricStat
                        label={t("compare.columns.ai")}
                        value={repo.ai_detection_coverage_pct}
                        format="rate"
                      />
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-2">
                    <span className="mb-1 block text-xs text-muted-foreground">
                      {t("compare.mobile.trend")}
                    </span>
                    <Sparkline data={repo.sparkline} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
