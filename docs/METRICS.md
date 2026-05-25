# Iris Metrics Dictionary

Canonical reference for every metric Iris produces. For the conceptual
rationale behind the metrics, see `METHODOLOGY.md`. This document is the
*what*, *how*, and *when-null* — not the *why*.

## How to read this document

Each entry has:
- **Field** — the exact JSON/TypeScript/Python field name
- **Unit / range** — what the value actually is
- **Source** — the Python module that computes it
- **Computation** — one-line algorithm
- **Nullable when** — when the field is absent from the JSON payload

When multiple fields are produced by the same analysis, they are grouped
under a shared heading.

## Conventions

**Naming.** Field names are `snake_case` in both the Python schema and the
JSON payload sent to `POST /api/ingest`. The TypeScript mirror in
`platform/src/types/metrics.ts` preserves the same names.

**Ratios.** Floats in `[0.0, 1.0]`, unless the name ends in `_pct` — those
are `0.0–100.0`. Example: `stabilization_ratio = 0.85` means 85%;
`ai_detection_coverage_pct = 85.0` also means 85%.

**Times.** Hours, unless suffix says otherwise (`_days`, `_minutes`).

**Percentage-point deltas.** Trend-delta thresholds live in
`iris/analysis/trend_delta.py`:
`PP_STABLE = 5.0 pp`, `PP_NOTABLE = 15.0 pp`, `HOURS_STABLE = 4.0 h`,
`HOURS_NOTABLE = 12.0 h`.

**Null semantics.** `ReportMetrics.to_dict()` strips any field whose value
is `None`, so absent fields in the JSON payload mean "not computed / not
applicable." The TypeScript interface mirrors this by marking those fields
optional.

**Origin values.** `"HUMAN" | "AI_ASSISTED" | "BOT"` — enum in
`iris/analysis/origin_classifier.py`.
**Intent values.** `"FEATURE" | "FIX" | "REFACTOR" | "CONFIG" | "UNKNOWN"` —
enum in `iris/models/intent.py`.

## Computation pipeline

Not every metric is produced by `metrics/aggregator.py`. The CLI enriches
the aggregate after the fact, and the report writer adds one field at
serialization time.

| Stage | Where | Fields added |
|---|---|---|
| Aggregation | `iris/metrics/aggregator.py` | Core, revert, intent, origin, commit shape, fix latency, cascades, stability map, attribution gap, churn detail, activity timeline, acceptance, PR lifecycle, fix targeting |
| Enrichment | `iris/cli.py::_merge_durability` | `durability_*` |
| Enrichment | `iris/cli.py::_merge_quality_metrics` | `duplicate_*`, `moved_code_pct`, `refactoring_ratio`, `move_by_origin`, `operation_*`, `revision_age_distribution`, `pct_revising_*`, `provenance_by_origin`, `new_code_churn_*` |
| Report-time | `iris/reports/writer.py` | `origin_funnel` (computed from finalized metrics; present in JSON, but field on `ReportMetrics` dataclass is always `None` in memory) |
| Post-report | `iris/cli.py` (report sections) | `velocity`, `author_velocity`, `adoption_timeline` — **not** on `ReportMetrics`, added directly to the output JSON and typed in `platform/src/types/metrics.ts` |

When reading a `metrics.json` from disk or the ingest payload, treat the
TypeScript `ReportMetrics` interface as the authoritative shape — it
includes every field the CLI can emit.

---

## 1. Core volume & stabilization

Always populated. These are the foundational signal/noise proxy.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `commits_total` | int ≥ 0 | `revert_detector.py` (passthrough) | never |
| `files_touched` | int ≥ 0 | `metrics/stabilization.py` | never |
| `files_stabilized` | int ≥ 0 | `metrics/stabilization.py` | never |
| `stabilization_ratio` | float `0.0–1.0` | `metrics/stabilization.py` | never (1.0 when `files_touched == 0`) |
| `churn_events` | int ≥ 0 | `analysis/churn_calculator.py` | never |
| `churn_lines_affected` | int ≥ 0 | `analysis/churn_calculator.py` | never |

**`stabilization_ratio`** — of all files touched in the window, the
fraction that had *no* subsequent modification within `churn_days` of any
prior touch. Files touched exactly once count as stabilized. Core quality
signal: closer to `1.0` = changes persist; closer to `0.0` = constant
rework.

**`churn_events`** — count of files modified 2+ times with at least one
consecutive pair of modifications ≤ `churn_days` apart.

**`churn_lines_affected`** — total `lines_added + lines_removed` across
all modifications of churning files.

---

## 2. Revert

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `commits_revert` | int ≥ 0 | `analysis/revert_detector.py` | never |
| `revert_rate` | float `0.0–1.0` | `analysis/revert_detector.py` | never (0.0 when `commits_total == 0`) |
| `revert_by_origin` | `Record<origin, {reverts, revert_rate}>` | `analysis/revert_detector.py` | no reverts, or no origin data |
| `revert_by_tool` | `Record<tool, {reverts}>` | `analysis/revert_detector.py` | no AI-tool-attributed reverts |

**Detection** — regex match on commit messages (`^Revert "…"`,
`^Revert …`, `This reverts commit <hash>`). Attribution credits the
*reverted* commit's origin, not the person who wrote the revert
("did AI-written code get reverted more?" — not "who cleans up AI?").

---

## 3. Intent classification

Always populated in v0.2+. Every commit is classified into one of five
intents via prefix → keyword → file-type heuristics (first match wins).

| Field | Unit | Source |
|---|---|---|
| `commit_intent_distribution` | `Record<intent, count>` | `analysis/intent_classifier.py` + `intent_metrics.py` |
| `churn_by_intent` | `Record<intent, {churn_events, churn_lines_affected}>` | `analysis/intent_metrics.py` |
| `stabilization_by_intent` | `Record<intent, StabilizationMetrics>` | `analysis/intent_metrics.py` |
| `lines_changed_by_intent` | `Record<intent, int>` | `analysis/intent_metrics.py` |

Heuristic order: (1) Conventional Commit prefix (`feat:`, `fix:`,
`refactor:`, `chore|build|ci|config:`); (2) keywords in message;
(3) 100%-config-file commits → `CONFIG`; (4) fallback `UNKNOWN`.

---

## 4. Origin (AI vs Human vs Bot)

Classification heuristic in `origin_classifier.py`:
1. Co-author patterns (`copilot`, `claude`, `anthropic`, `cursor`,
   `codeium`, `tabnine`, `amazon-q`, `gemini`, `windsurf`) → `AI_ASSISTED`
2. Author patterns (`[bot]`, `-bot`, known bot names) → `BOT`
3. Default → `HUMAN`

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `ai_detection_coverage_pct` | float `0.0–100.0` | `metrics/aggregator.py` | no non-bot commits |
| `commit_origin_distribution` | `Record<origin, count>` | `analysis/origin_metrics.py` | no `AI_ASSISTED` or `BOT` commits |
| `stabilization_by_origin` | `Record<origin, StabilizationMetrics>` | `analysis/origin_metrics.py` | same as above |
| `churn_by_origin` | `Record<origin, {churn_events, churn_lines_affected}>` | `analysis/origin_metrics.py` | same as above |

**`ai_detection_coverage_pct`** — `ai_commits / (total_non_bot_commits) × 100`.
A lower number means more AI work is slipping through without co-author
tags. Pair with `attribution_gap` for confidence.

---

## 5. Commit shape

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `commit_shape_dominant` | `"focused" \| "spread" \| "bulk" \| "surgical"` | `analysis/commit_shape.py` | no non-merge commits |
| `commit_shape_by_origin` | `Record<origin, ShapeProfile>` | `analysis/commit_shape.py` | < 10 commits per origin |

`ShapeProfile`: `commit_count`, `median_files_changed`,
`median_total_lines`, `median_lines_per_file`,
`median_directory_spread`, `dominant_shape`.

Shape classes (thresholds relative to corpus medians):
- **focused** — few files, many lines/file (deep change)
- **spread** — many files, few lines/file (wide & shallow; typical AI scaffolding)
- **bulk** — many files, many lines (large refactor/feature)
- **surgical** — few files, few lines (point fix, config tweak)

---

## 6. Fix latency

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `fix_latency_median_hours` | float ≥ 0 | `analysis/fix_latency.py` | no rework events |
| `fix_latency_by_origin` | `Record<origin, FixLatencyMetrics>` | `analysis/fix_latency.py` | < 10 rework events per origin |

`FixLatencyMetrics`: `median_latency_hours`, `fast_rework_pct` (% reworked
in < 72 h), `rework_count`. Rework = consecutive modifications of a file
within `churn_days`. Attribution: origin of the *original* commit
(answers "does AI code break faster?"). Buckets: fast < 72 h,
medium 72–168 h, slow > 168 h.

---

## 7. Correction cascades

A cascade is a trigger commit followed by one or more `FIX` commits on
shared files within the churn window. Triggers exclude merges, bots, and
`CONFIG` commits. Attribution: origin/tool of the *trigger*.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `cascade_rate` | float `0.0–1.0` | `analysis/cascade_detector.py` | insufficient trigger commits |
| `cascade_median_depth` | float ≥ 0 | `analysis/cascade_detector.py` | same |
| `cascade_rate_by_origin` | `Record<origin, CascadeMetrics>` | `analysis/cascade_detector.py` | < 5 commits per origin |
| `cascade_rate_by_tool` | `Record<tool, CascadeMetrics>` | `analysis/cascade_detector.py` | no AI tool reaches threshold |

`CascadeMetrics`: `total_commits`, `cascades`, `cascade_rate`, `median_depth`.

---

## 8. Code durability

Uses `git blame` at `HEAD` on modified files to attribute surviving lines.
Performance-bounded (cap `MAX_FILES_TO_BLAME = 50`, 15 s per blame).

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `durability_files_analyzed` | int ≥ 0 | `analysis/durability.py` (via `cli.py::_merge_durability`) | blame I/O unavailable |
| `durability_by_origin` | `Record<origin, DurabilityMetrics>` | same | < 20 lines introduced per origin |
| `durability_by_tool` | `Record<tool, DurabilityMetrics>` | same | no AI tool reaches threshold |

`DurabilityMetrics`: `lines_introduced`, `lines_surviving`,
`survival_rate` (float `0.0–1.0`), `median_age_days`.

**Note:** `durability_*` is computed outside the aggregator because it
needs repo-path I/O; the aggregator operates on commit lists only.

---

## 9. Acceptance rate

Requires PR data with `commit_hashes` populated. Each commit is mapped to
its PR (if any) and aggregated by origin and AI tool.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `acceptance_by_origin` | `Record<origin, AcceptanceMetrics>` | `analysis/acceptance_rate.py` | no PR data, or < 5 commits per origin |
| `acceptance_by_tool` | `Record<tool, AcceptanceMetrics>` | same | < 5 commits per tool |

`AcceptanceMetrics`: `total_commits`, `commits_in_prs`,
`pr_rate` (commits in PRs / total), `single_pass_rate` (PRs merged with
zero `CHANGES_REQUESTED` / PRs), `median_review_rounds`.

---

## 10. Origin funnel

Delivery funnel per origin. Computed at **report-write time** from the
finalized `ReportMetrics` — the `origin_funnel` attribute on the Python
dataclass is always `None`; the field only exists in the emitted JSON.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `origin_funnel` | `Record<origin, { stages[], overall_conversion }>` | `analysis/origin_funnel.py` (via `reports/writer.py`) | no `commit_origin_distribution` |

Stages: `Committed` → `In PR` → `Stabilized` → `Lines Surviving` (the
last stage only when durability data is available). Each stage carries
`count` and `conversion_from_previous`. `overall_conversion` is the
product of conversions.

**Limitation:** `PR → Merge` is not measured — Iris only fetches merged
PRs.

---

## 11. Attribution gap

Flags `HUMAN`-classified commits matching AI-like velocity patterns
(2+ of: burst ≥ 3 commits in 2 h by same author; LOC > 100;
interval < 30 min since same author's previous commit; files ≥ 5).

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `attribution_gap` | object (see below) | `analysis/attribution_gap.py` | < 3 flagged commits |

Object shape: `flagged_commits`, `total_human_commits`, `flagged_pct`,
`avg_loc`, `avg_files`, `avg_interval_minutes`.

Never labels a commit as AI — it surfaces a gap in attribution to
investigate.

---

## 12. Churn detail

Explains *why* stabilization dropped: drilldown into individual files and
co-changing pairs.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `churn_top_files` | `ChurnFileEntry[]` | `analysis/churn_detail.py` | insufficient churning files |
| `churn_couplings` | `ChurnCoupling[]` | `analysis/churn_detail.py` | no coupling detected |

`ChurnFileEntry`: `file`, `touches`, `total_lines`, `fix_count`, `chain`
(rendered sequence like `feat→fix→fix→fix`), `first_touch`, `last_touch`
(formatted `MM/DD`).

`ChurnCoupling`: `file_a`, `file_b`, `co_occurrences`, `coupling_rate`
(`co_occurrences / min(commits_a, commits_b)`).

Cap: `MAX_TOP_FILES = 10`.

---

## 13. Stability map

Per-directory aggregation of stabilization & churn.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `stability_map` | `StabilityMapEntry[]` | `analysis/stability_map.py` | no directory has ≥ 3 files touched |

`StabilityMapEntry`: `directory`, `files_touched`, `files_stabilized`,
`stabilization_ratio`, `churn_events`, `total_lines_changed`.

Directories are derived from path prefixes at depth 2 (default).
Classifiers: `stable` ≥ 0.80, `volatile` < 0.50.

---

## 14. Activity timeline

Weekly breakdown (ISO weeks, Monday–Sunday). Pattern detection across
weeks.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `activity_timeline` | `ActivityWeek[]` | `analysis/activity_timeline.py` | < 2 weeks of data |
| `activity_patterns` | `ActivityPattern[]` | `analysis/activity_timeline.py` | < 4 weeks, or no pattern |

`ActivityWeek`: `week_start`/`week_end` (ISO date), `commits`,
`lines_changed`, `intent` (distribution), `origin` (distribution),
`stabilization_ratio` (or `None` for weeks < 3 commits), `churn_events`,
`prs_merged`, `pr_median_ttm_hours`.

`ActivityPattern`: `pattern` (one of `burst_then_fix`, `quiet_period`,
`ai_ramp`, `intent_shift`), `week` (`MM/DD`), `description`.

Pattern thresholds:
- `burst_then_fix` — high-volume week followed by fix-dominant week
- `quiet_period` — < 25% of average commit volume
- `ai_ramp` — AI share jumps > 15 pp week-over-week
- `intent_shift` — any intent changes > 20 pp week-over-week

---

## 15. PR lifecycle

All fields require GitHub PR data.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `pr_merged_count` | int ≥ 0 | `analysis/pr_lifecycle.py` | no PR data |
| `pr_median_time_to_merge_hours` | float ≥ 0 | same | same |
| `pr_mean_time_to_merge_hours` | float ≥ 0 | same | same |
| `pr_p90_time_to_merge_hours` | float ≥ 0 | same | same |
| `pr_pct_merged_within_24h` | float `0.0–1.0` | same | same |
| `pr_cycle_time_buckets` | `{same_day, one_day, two_to_three_days, four_to_seven_days, seven_plus_days}` ints | same | same |
| `pr_median_size_files` | int ≥ 0 | same | same |
| `pr_median_size_lines` | int ≥ 0 | same | same |
| `pr_review_rounds_median` | float ≥ 0 | same | same |
| `pr_single_pass_rate` | float `0.0–1.0` | same | same |

`pr_review_rounds_median` — median count of `CHANGES_REQUESTED` reviews
per PR. `pr_single_pass_rate` — fraction of PRs with zero
`CHANGES_REQUESTED`. `pr_median_size_lines` — `additions + deletions`.

`pr_cycle_time_buckets` partitions merged PRs by open→merge duration
(boundaries: 24h, 48h, 4d, 8d). The five counts must sum to
`pr_merged_count`. `pr_pct_merged_within_24h` equals
`buckets.same_day / pr_merged_count` (engine emits it pre-computed so
percentile snapshots survive ingestion drops). The platform aggregates
these counts across repos to render the org-level Cycle Time view
without persisting individual PR durations.

---

## 16. Duplicate block detection

Identifies ≥ 5 contiguous non-trivial identical lines across files within
the same commit (copy-paste signal).

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `duplicate_block_rate` | float `0.0–1.0` | `analysis/duplicate_detector.py` (via `cli.py`) | diff data unavailable |
| `duplicate_block_count` | int ≥ 0 | same | same |
| `duplicate_median_block_size` | float ≥ 5 | same | same |
| `duplicate_by_origin` | `Record<origin, DuplicateMetrics>` | same | < MIN commits per origin |
| `duplicate_by_tool` | `Record<tool, DuplicateMetrics>` | same | no tool reaches threshold |

`DuplicateMetrics`: `commits_analyzed`, `commits_with_duplicates`,
`duplicate_rate`, `total_duplicate_blocks`, `median_block_size`.

Caps: `MIN_BLOCK_SIZE = 5`, `MAX_ADDED_LINES_PER_FILE = 500`.

---

## 17. Moved code / refactoring

Detects ≥ 3 contiguous lines removed from one file and added to another
in the same commit. Positive quality signal (real refactoring).

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `moved_code_pct` | float `0.0–1.0` | `analysis/move_detector.py` (via `cli.py`) | diff data unavailable |
| `refactoring_ratio` | float `0.0–1.0` \| `null` | same | no moved + duplicated lines observed |
| `move_by_origin` | `Record<origin, MoveByOrigin>` | same | < 10 commits per origin |

`refactoring_ratio = moved / (moved + duplicated)` — a code-health index.
Closer to `1.0` = refactors; closer to `0.0` = copy-paste.

`MoveByOrigin`: `commits_analyzed`, `commits_with_moves`, `moved_lines`,
`total_changed_lines`, `moved_code_pct`.

---

## 18. Code provenance (age of revised code)

Runs `git blame` on parent commits to determine how old the lines being
modified actually are.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `revision_age_distribution` | object (see below) | `analysis/code_provenance.py` (via `cli.py`) | blame unavailable |
| `pct_revising_new_code` | float `0.0–1.0` | same | same |
| `pct_revising_mature_code` | float `0.0–1.0` | same | same |
| `provenance_by_origin` | `Record<origin, ProvenanceByOrigin>` | same | < MIN commits per origin |

`revision_age_distribution`: `under_2_weeks`, `2_to_4_weeks`,
`1_to_12_months`, `1_to_2_years`, `over_2_years` — each a percentage
(float `0.0–100.0`).

`pct_revising_new_code = under_2_weeks + 2_to_4_weeks` (as a fraction of
the total; note: the sum is *of percentages* and rounded, then treated as
a fraction when rendered as `{:.0%}` — see `reports/narrative.py`).

`pct_revising_mature_code = 1_to_2_years + over_2_years`.

`ProvenanceByOrigin` entry: `pct_new_code`, `pct_mature_code`,
`median_age_days`, `lines_sampled`, `commits_analyzed`.

Caps: `MAX_COMMITS_TO_SAMPLE = 100`, `MAX_FILES_PER_COMMIT = 10`.

---

## 19. New code churn

Files that received new code in the window and were re-modified within 14
or 28 days. File-level proxy for GitClear's line-level metric.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `new_code_churn_rate_2w` | float `0.0–1.0` | `analysis/new_code_churn.py` (via `cli.py`) | < 10 files with new code |
| `new_code_churn_rate_4w` | float `0.0–1.0` | same | same |
| `new_code_churn_by_origin` | `Record<origin, NewCodeChurnMetrics>` | same | < 5 files per origin |
| `new_code_churn_by_tool` | `Record<tool, NewCodeChurnMetrics>` | same | no tool reaches threshold |

`NewCodeChurnMetrics`: `files_with_new_code`, `files_churned_2w`,
`files_churned_4w`, `churn_rate_2w`, `churn_rate_4w`.

Attribution: origin of the *introducing* commit.

---

## 20. Operation classification

Lightweight taxonomy of line operations (combines diffs with duplicate +
move results).

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `operation_distribution` | `{added, deleted, updated, moved, duplicated}` | `analysis/operation_classifier.py` (via `cli.py`) | < 10 commits with diff data |
| `operation_dominant` | `"added" \| "deleted" \| "updated" \| "moved" \| "duplicated"` | same | same |
| `operation_by_origin` | `Record<origin, OperationMix + commits_analyzed>` | same | < 10 commits per origin |

All values in `operation_distribution` are floats in `0.0–100.0` (the
five add up to 100 within rounding).

---

## 21. Fix targeting

Which origin's code attracts bug fixes.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `fix_target_by_origin` | `Record<origin, FixTargetMetrics>` | `analysis/fix_targeting.py` | < 5 fix events |
| `fix_target_by_tool` | `Record<tool, {fixes_attracted}>` | same | same |

`FixTargetMetrics`: `fixes_attracted`, `code_share_pct`, `fix_share_pct`,
`disproportionality` (= `fix_share / code_share`; > 1 means that origin's
code gets a disproportionate share of fixes).

Attribution for each `FIX` commit's targeted files: origin of the last
non-fix commit that modified the file.

---

## 22. Velocity (post-report, not on `ReportMetrics`)

Serialized into the output JSON by the report writer. Only surfaces in
the emitted payload / platform types — not on the in-memory dataclass.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `velocity` | `VelocityResult` | `analysis/velocity.py` | < 20 commits |

`VelocityResult`: `commits_per_week`, `lines_per_week`, `trend`
(`"accelerating" \| "stable" \| "decelerating"`), `trend_change_pct`,
`durability_correlation`, `windows: VelocityWindow[]`.

`VelocityWindow`: `start`, `end`, `commits_per_week`,
`stabilization_ratio`, `churn_rate`.

Defaults: 14-day windows; trend threshold ± 15%.

---

## 23. Author velocity (post-report, not on `ReportMetrics`)

LOC per author per week. Deliberately aggregated — this module is
**aggregator-opt-out by design**, so individual-author framing never
leaks into the main metrics.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `author_velocity` | `{ authors: [{name, high_velocity_weeks, ai_commit_pct}] }` | `analysis/author_velocity.py` | no commits |

Platform currently consumes the trimmed shape above; richer per-author
data (lines added/removed, weekly breakdowns) stays inside the engine's
report section. Threshold: `HIGH_VELOCITY_THRESHOLD = 1000 LOC/week`.

See `PRINCIPLES.md` #2 — these metrics exist to describe **system-level
AI adoption**, not rank individuals.

---

## 24. Flow Load (WIP simultâneo)

Per-ISO-week count of PRs in flight, segmented by intent, plus a count
of distinct commit authors per week as a separate engineering-parallelism
proxy.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `flow_load` | `FlowLoadWeek[]` | `analysis/flow_load.py` | < 2 weeks of signal |

`FlowLoadWeek`:

- `bucket` — ISO week label, e.g. `"2026-W18"`
- `bucket_start` / `bucket_end` — ISO dates (Monday and Sunday)
- `wip_total` — distinct PRs whose lifecycle overlaps the bucket
- `wip_by_intent` — same count broken down by PR intent
  (`FEATURE | FIX | REFACTOR | CONFIG | UNKNOWN`); PR intent is
  classified from the PR title using the same heuristics as
  `intent_classifier.py`
- `author_concurrency` — distinct commit authors (deduped by email,
  falling back to author name) with at least one non-merge commit in
  the bucket

Overlap rule for a bucket `[t_start, t_end)`:

```
created_at < t_end
AND (merged_at is None  OR merged_at > t_start)
AND (closed_at is None  OR closed_at > t_start)
```

Edge cases:

- A PR still open on the analysis date counts in every bucket from its
  `created_at` onward.
- A PR opened and merged/closed inside the same bucket counts in that
  bucket.
- Buckets with no PRs in flight emit `wip_total: 0` rather than being
  omitted.

Coverage limitations:

- **Engineering WIP only.** Backlog, discovery, design, and work kept on
  private local branches don't appear here. Surface this caveat
  alongside the chart so consumers don't read it as "company-wide WIP".
- **No per-author leak.** Only the *count* of distinct authors is
  persisted in `author_concurrency`; the underlying author list stays
  local to `flow_load.py`. This is intentional, to preserve Principle
  #2 (never rank individuals).
- **Title-based PR intent.** The file-type fallback in the commit
  classifier is inert here because PRs have no file list. Aggregating
  intent from a PR's commits is left as a future option to validate
  empirically.

Findings emitted by `narrative.py` (see `iris/i18n.py:finding_flow_load_*`):

- `finding_flow_load_descriptive` — always when `flow_load` exists:
  median WIP/week, peak week, median distinct authors/week.
- `finding_flow_load_feature_growth` — triggers when the last bucket's
  FEATURE WIP is ≥ `FLOW_LOAD_FEATURE_GROWTH_MULTIPLIER` (1.5×) the
  first bucket's, AND ≥ `FLOW_LOAD_FEATURE_GROWTH_MIN_ABSOLUTE` (2 PRs).
  **Both thresholds are hypotheses pending calibration with 3–5 repos.**

---

## 25. Flow Efficiency

Decomposes the merged-PR lifecycle into four phases — Coding, Awaiting
first review, In review, Awaiting merge — and reports the fraction that
was *active* (event-driven work) versus *wait*. Throughput numbers alone
say nothing about whether work is flowing or queued in a different shape.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `flow_efficiency_median` | float `0.0–1.0` | `analysis/flow_efficiency.py` | no merged PR survives the filters |
| `median_time_to_first_review_hours` | float ≥ 0 | same | no merged PR had a review |
| `time_in_phase_median_hours` | `Record<phase, hours>` | same | same as `flow_efficiency_median` |
| `flow_efficiency_by_intent` | `Record<intent, ratio>` | same | < `min_sample` (default 10) PRs in the segment |
| `flow_efficiency_by_origin` | `Record<origin, ratio>` | same | no `commit_origin_map` provided, or < `min_sample` PRs in the segment |

Phase model (5 timestamps → 4 phases per merged PR):

| Phase | Start → End | Default class |
|---|---|---|
| Coding | `min(commit.committed_at)` → `pr.created_at` | Active |
| Awaiting first review | `pr.created_at` → `min(review.submitted_at)` | Wait |
| In review | `first_review` → `min(approval)` (or `merged_at` when no approval) | Mixed — heuristic |
| Awaiting merge | `min(approval)` → `merged_at` | Wait |

Active/wait heuristic for "In review":

- Each event inside the phase (PR commits + reviews) marks the next
  `active_threshold_hours` hours as **active** (default 4 h,
  parametrizable). Intervals are unioned; the rest is **wait**.
- Threshold is a hypothesis pending calibration with 3–5 repos.

Phase keys in `time_in_phase_median_hours`:

- `coding`
- `awaiting_first_review`
- `in_review_active`
- `in_review_wait`
- `awaiting_merge`

Edge cases:

- **PR with no reviews** → entire `pr.created_at → merged_at` window is
  "Awaiting first review" (wait); In review and Awaiting merge are 0.
  PR contributes to `flow_efficiency_median` but not to
  `median_time_to_first_review_hours`.
- **PR merged without formal approval** → "In review" extends to
  `merged_at`; Awaiting merge is 0.
- **Instant-merge PRs** (`total_elapsed < min_elapsed_seconds`,
  default 5 min) → excluded from all aggregates so bot-driven auto-merges
  don't distort the median.
- **Bot reviewers are excluded from phase anchors**. Reviews authored by
  bot accounts (regex match against the same `_BOT_AUTHOR_PATTERNS` used
  by `origin_classifier`: `[bot]` / `-bot` suffix, plus `dependabot`,
  `renovate`, `github-actions`, `mergify`, `vercel`, `imgbot`) do *not*
  set `first_review_at` or `approval_at`. Without this filter, repos
  with auto-review bots (Vercel, Dependabot, CODEOWNERS auto-approval
  workflows) collapse the In Review phase to ~0 s and the metric reads
  "0% active" no matter what — entirely uninformative. Bot reviews
  *still* participate in the active/wait union heuristic as events
  inside the In Review phase, so signal from Copilot Review is
  preserved; only the phase-anchor timestamps drop bots. Origin
  classification on commits is by commit *author*, not reviewer.

PR origin rule (for `flow_efficiency_by_origin`):

- PR is `AI_ASSISTED` when ≥ 50 % of its non-bot commits are
  `AI_ASSISTED`; otherwise `HUMAN`. PRs with no classified commits are
  excluded from the by_origin segment. Bot-authored commits are excluded
  from both numerator and denominator. Rule is documented in
  `flow_efficiency._pr_origin`.

Privacy / ranking risk (Principle #2):

- **Flow Efficiency per individual PR is computed as an intermediate but
  never persisted**. The schema exposes only window-level aggregates.
- **Wait time is not attributed to specific reviewers** — "awaiting
  first review" is a property of the system, not of whoever should have
  reviewed.
- **Sample threshold**: by-intent/by-origin segments are emitted only
  when the segment has ≥ `min_sample` (default 10) PRs. Below that,
  the segment is omitted (not surfaced as "insufficient sample" — the
  UI just shows nothing for that segment).
- Code review checklist: confirm no endpoint or output exposes
  efficiency per PR linked to an author.

Findings emitted by `narrative.py` (see `iris/i18n.py:finding_flow_efficiency_*`):

- `finding_flow_efficiency_descriptive` — always when data exists:
  median efficiency as percent.
- `finding_flow_efficiency_low` — when median efficiency is below
  `FLOW_EFFICIENCY_LOW_THRESHOLD` (0.30); replaces the descriptive
  bullet. **Threshold is a hypothesis pending calibration.**
- `finding_time_to_first_review_slow` — when
  `median_time_to_first_review_hours > TIME_TO_FIRST_REVIEW_SLOW_HOURS`
  (24 h). Independent of the efficiency bullets.

---

## 26. Open PR Aging

Snapshot of the **currently open** PRs at run time: how old are they,
and how long since each one had any significant activity? Complements
Flow Load (WIP per window) and Flow Efficiency (active/wait of
*merged* PRs) — neither sees PRs that linger or never merge. Modelo
mental: Flow Load = "quanto trabalho simultâneo passou pelo time?";
Flow Efficiency = "do trabalho que saiu, foi eficiente?"; Open PR
Aging = "do trabalho que ainda não saiu, está represado?".

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `open_pr_count` | int | `analysis/open_pr_aging.py` | no eligible open PR (all drafts/bots) |
| `median_open_pr_age_days` | float ≥ 0 | same | same |
| `p90_open_pr_age_days` | float ≥ 0 | same | same |
| `stale_open_pr_pct` | float `0.0–1.0` | same | same |
| `very_stale_open_pr_pct` | float `0.0–1.0` | same | same |
| `abandonment_risk_pct` | float `0.0–1.0` | same | same |
| `median_open_pr_age_by_intent` | `Record<intent, days>` | same | < `min_sample` (default 5) PRs in segment |
| `stale_open_pr_pct_by_origin` | `Record<origin, ratio>` | same | no `commit_origin_map`, or < `min_sample` PRs in segment |

Per-PR signals (intermediate, **never persisted**):

- `age_days = floor((now - pr.created_at).days)`
- `days_since_last_activity = floor((now - last_activity_at).days)` where
  `last_activity_at = max(pr.created_at, latest review.submitted_at,
  latest commit_refs.committed_at)`. GitHub's `updatedAt` is **not**
  used — labels, assignees and other low-signal touches bump it and
  would mask genuine inactivity.

Filtering before aggregation:

- **Drafts** (`pr.is_draft == True`) are excluded — drafts are
  intentionally long-running.
- **Bot-authored PRs** are excluded via `_BOT_AUTHOR_PATTERNS`
  (single source of truth in `origin_classifier`). Dependabot,
  Renovate, etc. waiting on triage isn't "stuck work".

Staleness thresholds (constants at the top of `open_pr_aging.py`,
hypothesis pending calibration with 3–5 repos):

| Bucket | Threshold |
|---|---|
| `stale_open_pr_pct` | `days_since_last_activity ≥ 14` |
| `very_stale_open_pr_pct` | `≥ 30` |
| `abandonment_risk_pct` | `≥ 60` |

PR origin rule (for `stale_open_pr_pct_by_origin`): same 50% rule as
Flow Efficiency — PR is `AI_ASSISTED` when ≥ 50 % of its non-bot
commits are `AI_ASSISTED`, otherwise `HUMAN`; PRs with no classified
commits are excluded from the segment.

Privacy / ranking risk (Principle #2):

- Per-PR ages/staleness are computed as intermediates and never
  exposed in the schema or UI.
- Quebras secundárias are by **intent** and **origin of the work** —
  never by author. The PR-level booleans/ages have no name field.
- `min_sample = 5` keeps small segments (e.g. `AI_LED` with N=1)
  from implicitly identifying an individual.

Findings emitted by `narrative.py` (see `iris/i18n.py:finding_open_pr_aging_*`):

- `finding_open_pr_aging_descriptive` — always when `open_pr_count > 0`:
  count + median age.
- `finding_open_pr_aging_stale` — when
  `stale_open_pr_pct ≥ OPEN_PR_STALE_PCT_THRESHOLD` (0.30).
  **Threshold is a hypothesis pending calibration.**
- `finding_open_pr_aging_abandonment` — when
  `abandonment_risk_pct ≥ OPEN_PR_ABANDONMENT_PCT_THRESHOLD` (0.15).
- `finding_open_pr_aging_origin_gap` — when
  `stale_open_pr_pct_by_origin["AI_ASSISTED"] − [...]["HUMAN"]
  ≥ OPEN_PR_ORIGIN_GAP_PP` (0.20). "AI-assisted PRs go stale more
  often than human ones."

---

## 27. Adoption timeline (post-report, not on `ReportMetrics`)

When AI-assisted commits started appearing, and how the pre-adoption vs
post-adoption metrics compare.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `adoption_timeline` | `AdoptionTimeline` | `analysis/adoption_detector.py` | < 5 AI commits |

`AdoptionTimeline`: `first_ai_commit_date` (ISO), `adoption_ramp_start`,
`adoption_ramp_end` (nullable), `adoption_confidence`
(`"clear" \| "sparse" \| "insufficient"`), `total_ai_commits`,
`pre_adoption: ReportMetrics`, `post_adoption: ReportMetrics`.

Confidence rules:
- `clear` — ≥ 5 AI commits **and** 30-day window contains ≥ 3 AI commits
- `sparse` — ≥ 5 AI commits but no qualifying window
- `insufficient` — < 5 AI commits total

---

## DORA (real) — Datadog-derived

Populated when the org has an active Datadog integration and the CLI
fetched events from `GET /api/integrations/datadog/events` for the
analysis window. When the integration is absent or returns zero events,
every `dora_*` field is null and the report's DORA section is empty.

> **Note on dashboard consumption.** The platform dashboard does NOT
> aggregate the `dora_*` fields across per-repo payloads — every
> payload carries the same org-wide event slice from the endpoint, so
> summing them inflates counts by the number of repos. The dashboard
> queries `external_deployments` and `external_incidents` directly
> (`lib/queries/dora.ts`) for the org-wide and per-repo views. The
> only payload-derived `dora_*` fields the dashboard still reads are
> `dora_cfr_by_origin` and `dora_rollback_rate_by_origin`, which need
> the per-commit origin classification that can't be reproduced
> server-side.

| Field | Unit | Source | Nullable when |
|---|---|---|---|
| `dora_source` | `"datadog"` | `analysis/dora_real.py` | no active integration / no events fetched |
| `dora_deployments_total` | int ≥ 0 | same | same |
| `dora_deployments_failed` | int ≥ 0 | same | same |
| `dora_deployments_pending_evaluation` | int ≥ 0 | same | same |
| `dora_incidents_total` | int ≥ 0 | same | same |
| `dora_cfr` | float `0.0–1.0` | same | every deploy in the window is `change_failure=null` (still pending Datadog evaluation) |
| `dora_mttr_per_deploy_seconds_median` | seconds | same | no failed deploy carries `recovery_time_sec` |
| `dora_mttr_per_deploy_seconds_p90` | seconds | same | same |
| `dora_mttr_per_incident_seconds_median` | seconds | same | no incident carries `time_to_restore_seconds` |
| `dora_mttr_per_incident_seconds_p90` | seconds | same | same |
| `dora_rollback_rate` | float `0.0–1.0` | same | no failed deploys in the window |
| `dora_rollbacks_total` | int ≥ 0 | same | (always set when `dora_source` is) |
| `dora_lead_time_seconds_median` | seconds | same | no deploy carries `commits[].change_lead_time` |
| `dora_deploy_frequency_per_day` | float ≥ 0 | same | `ExternalDORAData.window_from`/`window_to` not provided |
| `dora_remediation_distribution` | `Record<remediation_type, int>` | same | no failed deploys in the window |
| `dora_cfr_by_origin` | `Record<origin, {failed, evaluated, cfr}>` | same | analysis run had no local commit-origin classification (e.g. CLI invoked without commit data) |
| `dora_rollback_rate_by_origin` | `Record<origin, {rollbacks, failed, rollback_rate}>` | same | no failed deploys in the window or no origin map |
| `dora_cfr_by_origin_coverage_pct` | float `0.0–100.0` | same | no origin map (matches the two `_by_origin` fields above) |

Tri-state `change_failure`:

- Datadog evaluates each deploy and assigns `change_failure ∈ {true, false, null}`.
- `null` means "still inside Datadog's evaluation window, no verdict yet".
- The CFR denominator is `count(change_failure in {true, false})` — `null` is excluded.
- Surfaced separately as `dora_deployments_pending_evaluation` so the dashboard can show *what we don't know yet*.

MTTR has two flavors that come from different events:

- **Per-deploy** (`dora_mttr_per_deploy_seconds_*`) — median/p90 of `recovery_time_sec` over failed deploys. Joins cleanly back to commits via `commit_sha`; this is the per-deploy lens the AI-vs-human correlation card uses (slice 5).
- **Per-incident** (`dora_mttr_per_incident_seconds_*`) — median/p90 of `time_to_restore_seconds` over failure events. Canonical DORA-reporting number.

By-origin attribution:

- `dora_cfr_by_origin` and `dora_rollback_rate_by_origin` count *per commit* on each evaluated deploy. A commit's origin is looked up from the local commit window's classifier output (`origin_classifier.classify_origins`). When a deploy references a commit older than the analysis window, the lookup fails silently — those commits don't appear in any per-origin bucket.
- `dora_cfr_by_origin_coverage_pct` reports the org-wide attribution rate: `known_origin_commits / (known + unknown)`. A low value means the by-origin numbers are computed over only a fraction of the data and may not generalize; a value at or near 100 means the analysis window covers every deploy's commits.

---

## Module → fields map

| Module | Fields populated |
|---|---|
| `metrics/stabilization.py` | `files_touched`, `files_stabilized`, `stabilization_ratio` |
| `analysis/churn_calculator.py` | `churn_events`, `churn_lines_affected` |
| `analysis/revert_detector.py` | `commits_total`, `commits_revert`, `revert_rate`, `revert_by_origin`, `revert_by_tool` |
| `analysis/intent_classifier.py` + `intent_metrics.py` | `commit_intent_distribution`, `churn_by_intent`, `stabilization_by_intent`, `lines_changed_by_intent` |
| `analysis/origin_classifier.py` + `origin_metrics.py` | `ai_detection_coverage_pct`, `commit_origin_distribution`, `stabilization_by_origin`, `churn_by_origin` |
| `analysis/commit_shape.py` | `commit_shape_dominant`, `commit_shape_by_origin` |
| `analysis/fix_latency.py` | `fix_latency_median_hours`, `fix_latency_by_origin` |
| `analysis/cascade_detector.py` | `cascade_rate`, `cascade_median_depth`, `cascade_rate_by_origin`, `cascade_rate_by_tool` |
| `analysis/durability.py` | `durability_files_analyzed`, `durability_by_origin`, `durability_by_tool` |
| `analysis/acceptance_rate.py` | `acceptance_by_origin`, `acceptance_by_tool` |
| `analysis/origin_funnel.py` | `origin_funnel` (JSON-only) |
| `analysis/attribution_gap.py` | `attribution_gap` |
| `analysis/churn_detail.py` | `churn_top_files`, `churn_couplings` |
| `analysis/activity_timeline.py` | `activity_timeline`, `activity_patterns` |
| `analysis/pr_lifecycle.py` | `pr_merged_count`, `pr_median_time_to_merge_hours`, `pr_mean_time_to_merge_hours`, `pr_p90_time_to_merge_hours`, `pr_pct_merged_within_24h`, `pr_cycle_time_buckets`, `pr_median_size_files`, `pr_median_size_lines`, `pr_review_rounds_median`, `pr_single_pass_rate` |
| `analysis/flow_load.py` | `flow_load` |
| `analysis/flow_efficiency.py` | `flow_efficiency_median`, `median_time_to_first_review_hours`, `time_in_phase_median_hours`, `flow_efficiency_by_intent`, `flow_efficiency_by_origin` |
| `analysis/dora_real.py` | `dora_source`, `dora_deployments_total`, `dora_deployments_failed`, `dora_deployments_pending_evaluation`, `dora_incidents_total`, `dora_cfr`, `dora_mttr_per_deploy_seconds_median`, `dora_mttr_per_deploy_seconds_p90`, `dora_mttr_per_incident_seconds_median`, `dora_mttr_per_incident_seconds_p90`, `dora_rollback_rate`, `dora_rollbacks_total`, `dora_lead_time_seconds_median`, `dora_deploy_frequency_per_day`, `dora_remediation_distribution`, `dora_cfr_by_origin`, `dora_rollback_rate_by_origin`, `dora_cfr_by_origin_coverage_pct` |
| `analysis/duplicate_detector.py` | `duplicate_block_rate`, `duplicate_block_count`, `duplicate_median_block_size`, `duplicate_by_origin`, `duplicate_by_tool` |
| `analysis/move_detector.py` | `moved_code_pct`, `refactoring_ratio`, `move_by_origin` |
| `analysis/code_provenance.py` | `revision_age_distribution`, `pct_revising_new_code`, `pct_revising_mature_code`, `provenance_by_origin` |
| `analysis/new_code_churn.py` | `new_code_churn_rate_2w`, `new_code_churn_rate_4w`, `new_code_churn_by_origin`, `new_code_churn_by_tool` |
| `analysis/operation_classifier.py` | `operation_distribution`, `operation_dominant`, `operation_by_origin` |
| `analysis/stability_map.py` | `stability_map` |
| `analysis/fix_targeting.py` | `fix_target_by_origin`, `fix_target_by_tool` |
| `analysis/velocity.py` | `velocity` (JSON-only) |
| `analysis/author_velocity.py` | `author_velocity` (JSON-only) |
| `analysis/adoption_detector.py` | `adoption_timeline` (JSON-only) |
| `analysis/pr_insights.py` | *(PR-scoped, not in repo metrics — powers `iris pr`)* |
| `analysis/priming_detector.py` | *(not in metrics payload — feeds narrative / report)* |
| `analysis/trend_delta.py` | *(operates on two `ReportMetrics` — powers trend section)* |
| `analysis/org_intelligence.py` | *(operates on a collection of per-repo `RepoResult` — powers org report)* |

## Known code/schema drift

- **`origin_funnel`** appears on the Python `ReportMetrics` dataclass but
  is never populated there; it is injected into the JSON at
  `reports/writer.py:58-60`. Consumers reading the JSON will see it;
  consumers reading the dataclass in-process will not.
- **`velocity`, `author_velocity`, `adoption_timeline`** are in the
  TypeScript `ReportMetrics` interface and in the emitted JSON, but are
  *not* fields on the Python `ReportMetrics` dataclass. The platform is
  the source of truth for the full payload shape.
- Origin values in some dict keys include `"BOT"` (from
  `CommitOrigin.BOT`), but several `by_origin` rollups only emit
  `"HUMAN"` and `"AI_ASSISTED"` rows (e.g., `revert_by_origin`).
  Consumers should treat missing origin keys as absent, not zero.
