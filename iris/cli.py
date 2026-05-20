"""Iris CLI — analyze Git repositories for engineering signal vs noise."""

import argparse
import os
import sys
import time
from datetime import datetime, timedelta, timezone

from iris.i18n import get_strings, SUPPORTED_LANGS
from iris.platform.telemetry import span, record_metric, record_counter, record_duration, flush
from iris.ingestion.git_reader import read_commits
from iris.ingestion.github_reader import read_pull_requests
from iris.metrics.aggregator import aggregate
from iris.models.context import AnalysisContext
from iris.reports.narrative import generate_narrative
from iris.reports.writer import write_output

VERSION = "v1.0.7"


def _merge_durability(metrics, durability):
    """Merge durability results into a ReportMetrics (frozen dataclass)."""
    from dataclasses import asdict
    from iris.models.metrics import ReportMetrics

    d = asdict(metrics)
    d["durability_files_analyzed"] = durability.files_analyzed
    d["durability_by_origin"] = {
        bo.origin: {
            "lines_introduced": bo.lines_introduced,
            "lines_surviving": bo.lines_surviving,
            "survival_rate": bo.survival_rate,
            "median_age_days": bo.median_age_days,
        }
        for bo in durability.by_origin
    }
    if durability.by_tool:
        d["durability_by_tool"] = {
            bt.tool: {
                "lines_introduced": bt.lines_introduced,
                "lines_surviving": bt.lines_surviving,
                "survival_rate": bt.survival_rate,
                "median_age_days": bt.median_age_days,
            }
            for bt in durability.by_tool
        }
    return ReportMetrics(**{k: v for k, v in d.items()})


def _merge_quality_metrics(metrics, dup_result, move_result, ops_result, provenance, new_churn):
    """Merge all code quality analysis results into ReportMetrics."""
    from dataclasses import asdict
    from iris.models.metrics import ReportMetrics

    d = asdict(metrics)

    if dup_result is not None:
        d["duplicate_block_rate"] = dup_result.duplicate_block_rate
        d["duplicate_block_count"] = dup_result.total_duplicate_blocks
        d["duplicate_median_block_size"] = dup_result.median_duplicate_block_size
        if dup_result.by_origin:
            d["duplicate_by_origin"] = {
                bo.origin: {
                    "commits_analyzed": bo.commits_analyzed,
                    "commits_with_duplicates": bo.commits_with_duplicates,
                    "duplicate_rate": bo.duplicate_rate,
                    "total_duplicate_blocks": bo.total_duplicate_blocks,
                    "median_block_size": bo.median_block_size,
                }
                for bo in dup_result.by_origin
            }
        if dup_result.by_tool:
            d["duplicate_by_tool"] = {
                bt.tool: {
                    "commits_analyzed": bt.commits_analyzed,
                    "commits_with_duplicates": bt.commits_with_duplicates,
                    "duplicate_rate": bt.duplicate_rate,
                    "total_duplicate_blocks": bt.total_duplicate_blocks,
                    "median_block_size": bt.median_block_size,
                }
                for bt in dup_result.by_tool
            }

    if move_result is not None:
        d["moved_code_pct"] = move_result.moved_code_pct
        d["refactoring_ratio"] = move_result.refactoring_ratio
        if move_result.by_origin:
            d["move_by_origin"] = {
                bo.origin: {
                    "commits_analyzed": bo.commits_analyzed,
                    "commits_with_moves": bo.commits_with_moves,
                    "moved_lines": bo.moved_lines,
                    "total_changed_lines": bo.total_changed_lines,
                    "moved_code_pct": bo.moved_code_pct,
                }
                for bo in move_result.by_origin
            }

    if ops_result is not None:
        d["operation_distribution"] = {
            "added": ops_result.overall.pct_added,
            "deleted": ops_result.overall.pct_deleted,
            "updated": ops_result.overall.pct_updated,
            "moved": ops_result.overall.pct_moved,
            "duplicated": ops_result.overall.pct_duplicated,
        }
        d["operation_dominant"] = ops_result.overall.dominant_operation
        if ops_result.by_origin:
            d["operation_by_origin"] = {
                bo.origin: {
                    "added": bo.mix.pct_added,
                    "deleted": bo.mix.pct_deleted,
                    "updated": bo.mix.pct_updated,
                    "moved": bo.mix.pct_moved,
                    "duplicated": bo.mix.pct_duplicated,
                    "dominant": bo.mix.dominant_operation,
                    "commits_analyzed": bo.commits_analyzed,
                }
                for bo in ops_result.by_origin
            }

    if provenance is not None:
        overall = provenance.overall
        d["revision_age_distribution"] = {
            "under_2_weeks": overall.pct_under_2_weeks,
            "2_to_4_weeks": overall.pct_2_to_4_weeks,
            "1_to_12_months": overall.pct_1_to_12_months,
            "1_to_2_years": overall.pct_1_to_2_years,
            "over_2_years": overall.pct_over_2_years,
        }
        d["pct_revising_new_code"] = round(
            overall.pct_under_2_weeks + overall.pct_2_to_4_weeks, 3
        )
        d["pct_revising_mature_code"] = round(
            overall.pct_1_to_2_years + overall.pct_over_2_years, 3
        )
        if provenance.by_origin:
            d["provenance_by_origin"] = {
                bo.origin: {
                    "pct_new_code": round(
                        bo.distribution.pct_under_2_weeks + bo.distribution.pct_2_to_4_weeks, 3
                    ),
                    "pct_mature_code": round(
                        bo.distribution.pct_1_to_2_years + bo.distribution.pct_over_2_years, 3
                    ),
                    "median_age_days": bo.distribution.median_age_days,
                    "lines_sampled": bo.distribution.lines_sampled,
                    "commits_analyzed": bo.commits_analyzed,
                }
                for bo in provenance.by_origin
            }

    if new_churn is not None:
        d["new_code_churn_rate_2w"] = new_churn.new_code_churn_rate_2w
        d["new_code_churn_rate_4w"] = new_churn.new_code_churn_rate_4w
        if new_churn.by_origin:
            d["new_code_churn_by_origin"] = {
                bo.origin: {
                    "files_with_new_code": bo.files_with_new_code,
                    "files_churned_2w": bo.files_churned_2w,
                    "files_churned_4w": bo.files_churned_4w,
                    "churn_rate_2w": bo.churn_rate_2w,
                    "churn_rate_4w": bo.churn_rate_4w,
                }
                for bo in new_churn.by_origin
            }
        if new_churn.by_tool:
            d["new_code_churn_by_tool"] = {
                bt.tool: {
                    "files_with_new_code": bt.files_with_new_code,
                    "files_churned_2w": bt.files_churned_2w,
                    "files_churned_4w": bt.files_churned_4w,
                    "churn_rate_2w": bt.churn_rate_2w,
                    "churn_rate_4w": bt.churn_rate_4w,
                }
                for bt in new_churn.by_tool
            }

    return ReportMetrics(**{k: v for k, v in d.items()})


def _fetch_external_dora_if_available(commits, days: int):
    """Pull DORA events from the platform when the user is logged in.

    Best-effort: any failure (no auth, no integration, network error)
    falls through with None so the analysis still ships without the
    dora_* metrics. The window matches the commit-analysis window so
    deploys can be joined to commits by commit_sha downstream.
    """
    try:
        from iris.platform.config import get_auth
        from iris.ingestion.external_reader import fetch_external_dora
    except ImportError:
        return None

    auth = get_auth()
    if not auth:
        return None
    server_url, token = auth

    now = datetime.now(timezone.utc)
    window_from = now - timedelta(days=days)
    return fetch_external_dora(
        server_url=server_url,
        token=token,
        window_from=window_from,
        window_to=now,
    )


def _is_git_repo(path: str) -> bool:
    """Check if path contains a .git directory."""
    return os.path.isdir(os.path.join(path, ".git"))


def _git_remote_url(repo_path: str) -> str | None:
    """Return the raw `origin` remote URL for ``repo_path`` (or None).

    Used both by ``_repo_name_from_remote`` (parses out the repo name)
    and by the push path (needs the full URL so the platform can
    normalize it against the Datadog `repository_id` for DORA event
    matching).
    """
    import subprocess
    try:
        result = subprocess.run(
            ["git", "-C", repo_path, "remote", "get-url", "origin"],
            capture_output=True, text=True, check=True,
        )
        url = result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return url or None


def _repo_name_from_remote(repo_path: str) -> str | None:
    """Extract repository name from git remote origin URL.

    Supports HTTPS, SSH, and other common formats:
      git@github.com:org/repo-name.git  →  repo-name
      https://github.com/org/repo.git   →  repo
      git@gitlab.com:group/sub/repo.git →  repo
    """
    import re
    url = _git_remote_url(repo_path)
    if not url:
        return None

    # Strip .git suffix and trailing slashes
    url = re.sub(r"\.git/?$", "", url).rstrip("/")
    # Take the last path segment as repo name
    name = url.rsplit("/", 1)[-1]
    # Also handle SSH colon format: git@host:org/repo
    name = name.rsplit(":", 1)[-1]
    return name if name else None


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="iris",
        description=(
            "Engineering intelligence for the AI era. "
            "Analyzes a Git repository and generates an impact report "
            "measuring delivery signal vs noise."
        ),
        epilog=(
            "commands:\n"
            "  iris login                          Connect to Iris platform\n"
            "  iris auth status                    Show current auth config\n"
            "  iris auth logout                    Remove saved credentials\n"
            "  iris hook install <repo> [--auto-push]  Install AI commit tracking\n"
            "  iris hook uninstall <repo>          Remove hooks from a repo\n"
            "  iris hook status <repo>             Check hook installation\n"
            "  iris pr [number]                    Analyze a PR and output insights\n"
            "  iris push <metrics.json>            Push metrics file to platform\n"
            "  iris upgrade                        Update to latest version\n"
            "  iris uninstall                      Remove Iris from your machine\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "repo_path",
        nargs="?",
        default=None,
        help="Path to a local Git repository",
    )
    parser.add_argument(
        "--org",
        default=None,
        help="Path to organization directory containing Git repositories",
    )
    parser.add_argument(
        "--repos",
        default=None,
        help="Comma-separated list of repo names to analyze (requires --org)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=90,
        help="Lookback window in days (default: 90)",
    )
    parser.add_argument(
        "--churn-days",
        type=int,
        default=14,
        help="Churn detection window in days (default: 14)",
    )
    parser.add_argument(
        "--out",
        default="out",
        help="Output directory (default: out)",
    )
    parser.add_argument(
        "--lang",
        choices=SUPPORTED_LANGS,
        default="en",
        help="Report language (default: en)",
    )
    parser.add_argument(
        "--trend",
        action="store_true",
        default=False,
        help="Enable trend analysis (compare recent vs baseline)",
    )
    parser.add_argument(
        "--recent-days",
        type=int,
        default=30,
        help="Recent window in days for trend analysis (default: 30)",
    )
    parser.add_argument(
        "--push",
        action="store_true",
        default=False,
        help="(default if logged in) Push metrics to Iris platform",
    )
    parser.add_argument(
        "--no-push",
        action="store_true",
        default=False,
        help="Skip auto-push even if logged in (write to filesystem only)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        default=False,
        help=(
            "Show detailed debug output: cumulative elapsed time after "
            "each analysis stage (useful for diagnosing slow runs on busy "
            "repos), plus the author → GitHub login mapping at push time."
        ),
    )
    return parser.parse_args(argv)


def _run_single_repo(args: argparse.Namespace) -> None:
    """Run analysis on a single repository (original mode)."""
    analysis_start = time.time()
    s = get_strings(args.lang)

    def _tick(label: str) -> None:
        """Print cumulative elapsed time after a stage, when --verbose is set."""
        if args.verbose:
            print(f"  [+{time.time() - analysis_start:6.1f}s] {label}", flush=True)

    repo = os.path.abspath(args.repo_path)
    if not os.path.isdir(repo):
        print(s["cli_error_not_dir"].format(path=args.repo_path), file=sys.stderr)
        sys.exit(1)

    if not _is_git_repo(repo):
        print(s["cli_error_not_git"].format(path=args.repo_path), file=sys.stderr)
        sys.exit(1)

    repo_name = _repo_name_from_remote(repo) or os.path.basename(repo)
    org_name = os.path.basename(os.path.dirname(repo))
    out_dir = os.path.join(os.path.abspath(args.out), f"{args.days}d")

    ctx = AnalysisContext(
        repo_path=repo,
        repo_name=repo_name,
        days=args.days,
        churn_days=args.churn_days,
        out_dir=out_dir,
        org_name=org_name,
        lang=args.lang,
    )

    # Check early if we'll push (to adjust output)
    from iris.platform.config import get_auth
    will_push = not args.no_push and get_auth() is not None

    print(f"Iris {VERSION}")
    print(f"{s['cli_banner_repo']:<14}: {repo}")
    print(f"{s['cli_banner_lookback']:<14}: {args.days} {s['unit_days']}")
    print(f"{s['cli_banner_churn']:<14}: {args.churn_days} {s['unit_days']}")
    if not will_push:
        print(f"{s['cli_banner_output']:<14}: {out_dir}")
    print()

    # Step 1: Ingest commits
    print(s["cli_reading_commits"], end=" ", flush=True)
    with span("ingestion.commits", {"repo": repo_name, "days": args.days}):
        commits = read_commits(repo, days=args.days)
    print(s["cli_commits_found"].format(count=len(commits)))
    _tick("commits read")

    if not commits:
        print(s["cli_no_commits"])
        sys.exit(0)

    # Step 2: Fetch pull requests (optional, graceful fallback)
    print(s["cli_reading_prs"], end=" ", flush=True)
    with span("ingestion.pull_requests", {"repo": repo_name}):
        try:
            prs = read_pull_requests(repo, days=args.days)
        except Exception:
            prs = []
    if prs:
        print(s["cli_prs_found"].format(count=len(prs)))
    else:
        print(s["cli_prs_skipped"])
    _tick("pull requests fetched")

    # Step 3: Classify commits by intent
    print(s["cli_classifying"], end=" ", flush=True)

    # Optional: pull DORA events from a connected platform integration
    # (Datadog) so the aggregator can populate the dora_* metrics.
    external_data = None
    if will_push:
        external_data = _fetch_external_dora_if_available(commits, args.days)

    # Step 4: Analyze and aggregate metrics
    with span("analysis.aggregate", {"repo": repo_name, "commits": len(commits)}):
        metrics = aggregate(
            commits,
            churn_days=args.churn_days,
            prs=prs or None,
            external_data=external_data,
        )
    print(s["cli_classified"].format(count=len(commits)))
    _tick("aggregate analysis done")

    if metrics.fix_latency_median_hours is not None:
        print(s["cli_fix_latency_computed"].format(
            median=metrics.fix_latency_median_hours,
            count=metrics.churn_events,
        ))
    else:
        print(s["cli_fix_latency_none"])

    # Step 5: Trend analysis (optional, opt-in)
    trend = None
    if args.trend:
        from iris.analysis.trend_delta import compute_trend_delta

        print(s["cli_trend_analyzing"], end=" ", flush=True)
        cutoff = datetime.now(timezone.utc) - timedelta(days=args.recent_days)
        recent_commits = [c for c in commits if c.date >= cutoff]
        recent_prs = [p for p in (prs or []) if p.created_at >= cutoff] or None

        recent_metrics = aggregate(
            recent_commits, churn_days=args.churn_days, prs=recent_prs,
        )
        trend = compute_trend_delta(
            baseline=metrics,
            recent=recent_metrics,
            baseline_days=args.days,
            recent_days=args.recent_days,
            lang=args.lang,
        )
        if trend.has_sufficient_data:
            print(s["cli_trend_done"].format(
                recent=args.recent_days, baseline=args.days,
            ))
        else:
            print(s["cli_trend_insufficient"].format(
                count=len(recent_commits),
            ))

    # Step 4b: Priming doc detection
    from iris.analysis.priming_detector import detect_priming

    priming = detect_priming(repo)
    if priming.has_priming:
        file_list = ", ".join(f.path for f in priming.files)
        print(f"Priming docs detected: {file_list}")
    else:
        print("No priming docs detected.")

    # Step 4c: Code durability (git blame)
    from iris.analysis.durability import calculate_durability
    from iris.analysis.origin_classifier import classify_origins

    origin_classified = classify_origins(commits)
    from iris.analysis.origin_classifier import build_tool_map
    tool_map = build_tool_map(origin_classified)
    durability = calculate_durability(repo, commits, origin_classified, tool_map=tool_map)
    if durability:
        print(f"Durability: {durability.files_analyzed} files analyzed via git blame.")
        metrics = _merge_durability(metrics, durability)
    else:
        print("Durability: skipped (insufficient multi-touch files).")
    _tick("durability (git blame) done")

    # Step 4d: Diff-based code quality analyses
    from iris.ingestion.diff_reader import read_commit_diffs
    from iris.analysis.duplicate_detector import detect_duplicates
    from iris.analysis.move_detector import detect_moves
    from iris.analysis.operation_classifier import classify_operations
    from iris.analysis.code_provenance import calculate_provenance
    from iris.analysis.new_code_churn import calculate_new_code_churn

    print(s["cli_reading_diffs"], end=" ", flush=True)
    with span("analysis.diffs", {"repo": repo_name}):
        commit_diffs = read_commit_diffs(repo, commits)
    print(s["cli_diffs_analyzed"].format(count=len(commit_diffs)))
    _tick("diffs read")

    dup_result = detect_duplicates(commit_diffs, origin_classified, tool_map=tool_map)
    if dup_result:
        print(s["cli_duplicates_found"].format(
            rate=dup_result.duplicate_block_rate,
            count=dup_result.total_duplicate_blocks,
        ))
    else:
        print(s["cli_duplicates_none"])

    move_result = detect_moves(commit_diffs, origin_classified, dup_result)
    if move_result:
        print(s["cli_moves_found"].format(pct=move_result.moved_code_pct))
    else:
        print(s["cli_moves_none"])

    ops_result = classify_operations(
        commits, commit_diffs, origin_classified, dup_result, move_result,
    )
    if ops_result:
        print(s["cli_operations_done"].format(dominant=ops_result.overall.dominant_operation))
    else:
        print(s["cli_operations_none"])

    # Step 4e: Code provenance (blame-based)
    provenance = calculate_provenance(repo, commits, origin_classified)
    if provenance:
        print(s["cli_provenance_done"].format(
            files=provenance.files_blamed,
            lines=provenance.overall.lines_sampled,
        ))
    else:
        print(s["cli_provenance_none"])
    _tick("provenance (git blame) done")

    # Step 4f: New code churn rate
    new_churn = calculate_new_code_churn(commits, origin_classified, tool_map=tool_map)
    if new_churn:
        print(s["cli_new_churn_done"].format(
            rate_2w=new_churn.new_code_churn_rate_2w,
            rate_4w=new_churn.new_code_churn_rate_4w,
        ))
    else:
        print(s["cli_new_churn_none"])

    # Merge all quality metrics
    metrics = _merge_quality_metrics(
        metrics, dup_result, move_result, ops_result, provenance, new_churn,
    )
    _tick("quality metrics merged")

    # Step 5b: Adoption timeline detection
    adoption = None
    from iris.analysis.adoption_detector import detect_adoption, MIN_AI_COMMITS
    from iris.models.adoption import AdoptionResult

    event, pre_commits, post_commits = detect_adoption(commits)
    if event is None:
        print(s["cli_adoption_none"])
    elif event.adoption_confidence == "insufficient":
        print(s["cli_adoption_insufficient"].format(
            count=event.total_ai_commits, min=MIN_AI_COMMITS,
        ))
    elif not pre_commits:
        print(s["cli_adoption_no_pre"])
    else:
        print(s["cli_adoption_detected"].format(
            confidence=event.adoption_confidence,
            date=event.first_ai_commit_date.strftime("%Y-%m-%d"),
        ))

        # Split PRs by adoption date
        pre_prs = [p for p in (prs or []) if p.created_at < event.adoption_ramp_start] or None
        post_prs = [p for p in (prs or []) if p.created_at >= event.adoption_ramp_start] or None

        pre_metrics = aggregate(pre_commits, churn_days=args.churn_days, prs=pre_prs)
        post_metrics = aggregate(post_commits, churn_days=args.churn_days, prs=post_prs)

        # Compute day spans from commit date ranges
        pre_days = max(1, (pre_commits[-1].date - pre_commits[0].date).days)
        post_days = max(1, (post_commits[-1].date - post_commits[0].date).days)

        from iris.analysis.trend_delta import compute_trend_delta

        comparison = compute_trend_delta(
            baseline=pre_metrics,
            recent=post_metrics,
            baseline_days=pre_days,
            recent_days=post_days,
            lang=args.lang,
        )

        adoption = AdoptionResult(
            event=event,
            pre_metrics=pre_metrics,
            post_metrics=post_metrics,
            comparison=comparison,
            pre_days=pre_days,
            post_days=post_days,
        )

    # Step 5c: Velocity analysis
    velocity = None
    from iris.analysis.velocity import compute_velocity, MIN_COMMITS_FOR_VELOCITY

    velocity = compute_velocity(commits, churn_days=args.churn_days)
    if velocity:
        print(s["cli_velocity_computed"].format(
            cpw=velocity.overall_commits_per_week,
            trend=velocity.velocity_trend,
        ))
    else:
        print(s["cli_velocity_skipped"].format(min=MIN_COMMITS_FOR_VELOCITY))

    # Step 5d: Author velocity (LOC per author per week)
    author_velocity = None
    from iris.analysis.author_velocity import compute_author_velocity
    origin_map_for_velocity = {c.hash: origin.value for c, origin in origin_classified}
    author_velocity = compute_author_velocity(commits, origin_map=origin_map_for_velocity)
    if author_velocity:
        high = author_velocity.high_velocity_authors
        total = author_velocity.total_authors
        if high > 0:
            print(f"Author velocity: {total} authors, {high} with high LOC/week (>1000).")
        else:
            print(f"Author velocity: {total} authors analyzed.")
    _tick("velocity + author velocity done")

    # Step 6: Generate narrative
    narrative = generate_narrative(metrics, lang=args.lang, trend=trend)

    # Step 7: Write output
    # If pushing, write to a temp dir (don't pollute the repo)
    import tempfile
    if will_push:
        tmp_out = tempfile.mkdtemp(prefix="iris-")
        actual_out_dir = ctx.out_dir
        ctx = AnalysisContext(
            repo_path=ctx.repo_path, repo_name=ctx.repo_name,
            org_name=ctx.org_name, out_dir=tmp_out,
            days=ctx.days, churn_days=ctx.churn_days, lang=ctx.lang,
        )

    print(s["cli_writing_report"], end=" ", flush=True)
    report_path, metrics_path = write_output(
        ctx, metrics, narrative_sections=narrative, trend=trend,
        adoption=adoption, velocity=velocity, priming=priming,
        author_velocity=author_velocity,
    )
    print(s["cli_done"])
    _tick("report written")

    # Record telemetry
    record_duration("iris.analysis.duration_seconds", analysis_start, {"repo": repo_name})
    record_counter("iris.analysis.commits_analyzed", len(commits), {"repo": repo_name})
    record_metric("iris.metrics.stabilization_ratio", metrics.stabilization_ratio, {"repo": repo_name})
    record_metric("iris.metrics.churn_events", float(metrics.churn_events), {"repo": repo_name})
    record_metric("iris.metrics.revert_rate", metrics.revert_rate, {"repo": repo_name})

    # Push or write to filesystem
    if will_push:
        import shutil
        # Extract unique commit authors using GitHub API to resolve real names.
        import re
        import subprocess

        def _gh_username(email: str) -> str | None:
            """Extract GitHub username from noreply email."""
            m = re.match(r"(?:\d+\+)?(.+)@users\.noreply\.github\.com$", email)
            return m.group(1) if m else None

        def _resolve_gh_name(username: str) -> str | None:
            """Resolve GitHub username to real name via gh API."""
            try:
                r = subprocess.run(
                    ["gh", "api", f"users/{username}", "-q", ".name"],
                    capture_output=True, text=True, timeout=5,
                )
                if r.returncode == 0 and r.stdout.strip():
                    return r.stdout.strip()
            except (FileNotFoundError, subprocess.TimeoutExpired):
                pass
            return None

        def _resolve_emails_via_repo(nwo: str, emails: set[str]) -> dict[str, str]:
            """Resolve emails to GitHub logins using the repo's commit API."""
            result: dict[str, str] = {}
            for email in emails:
                try:
                    r = subprocess.run(
                        ["gh", "api", f"repos/{nwo}/commits?author={email}&per_page=1",
                         "-q", ".[0].author.login"],
                        capture_output=True, text=True, timeout=10,
                    )
                    if r.returncode == 0 and r.stdout.strip():
                        result[email] = r.stdout.strip()
                except (FileNotFoundError, subprocess.TimeoutExpired):
                    pass
            return result

        # Step 1: Collect all unique emails and resolve GitHub usernames
        email_to_names: dict[str, set[str]] = {}
        gh_usernames: set[str] = set()
        email_gh_cache: dict[str, str] = {}  # email → github username

        for c in commits:
            email = (c.author_email or "").lower()
            if email:
                email_to_names.setdefault(email, set()).add(c.author)
                gh = _gh_username(email)
                if gh:
                    gh_usernames.add(gh)
                    email_gh_cache[email] = gh

        # Resolve remaining emails via GitHub repo API
        from iris.ingestion.github_reader import detect_github_remote
        nwo = detect_github_remote(repo)
        if nwo:
            unresolved = {e for e in email_to_names if e not in email_gh_cache}
            if unresolved:
                repo_resolved = _resolve_emails_via_repo(nwo, unresolved)
                for email, login in repo_resolved.items():
                    email_gh_cache[email] = login
                    gh_usernames.add(login)

        # Step 2: Resolve GitHub usernames to real names
        gh_name_cache: dict[str, str] = {}
        for username in gh_usernames:
            real_name = _resolve_gh_name(username)
            if real_name:
                gh_name_cache[username.lower()] = real_name

        # Step 3: Build identity map — group by GitHub username or email local
        identity_names: dict[str, str] = {}  # key → best name
        identity_github: dict[str, str | None] = {}  # key → github username
        for email, names in email_to_names.items():
            gh = email_gh_cache.get(email)
            key = (gh or email.split("@")[0]).lower()

            # Best name: GitHub API name > longest git name
            best = gh_name_cache.get(key) or max(names, key=len)
            if key in identity_names:
                # Keep the one with spaces (real name) or longest
                old = identity_names[key]
                if " " in best and " " not in old:
                    identity_names[key] = best
                elif len(best) > len(old):
                    identity_names[key] = best
            else:
                identity_names[key] = best

            # Track GitHub username for avatar
            if gh and key not in identity_github:
                identity_github[key] = gh

        # Build active_users as objects with name + github username
        active_users_list = []
        seen_names: set[str] = set()
        for key, name in sorted(identity_names.items(), key=lambda x: x[1]):
            if name in seen_names:
                continue
            seen_names.add(name)
            entry: dict[str, str] = {"name": name}
            gh_user = identity_github.get(key)
            if gh_user:
                entry["github"] = gh_user
            active_users_list.append(entry)
        active_users = active_users_list
        if args.verbose:
            print("\n[verbose] Active Contributors → GitHub mapping:")
            for u in active_users:
                gh = u.get("github")
                status = f"→ {gh}" if gh else "  (no GitHub login)"
                print(f"  {u['name']:<30} {status}")
            print()
        with span("push", {"repo": repo_name}):
            _push_after_analysis(
                metrics_path,
                repo_name,
                args.days,
                repo_path=ctx.repo_path,
                active_users=active_users,
            )
        record_counter("iris.push.success", 1, {"repo": repo_name})
        shutil.rmtree(tmp_out, ignore_errors=True)
    else:
        print()
        print(f"{s['cli_label_report']:<14}: {report_path}")
        print(f"{s['cli_label_metrics']:<14}: {metrics_path}")

    flush()


def _run_org(args: argparse.Namespace) -> None:
    """Run analysis across all repos in an organization directory."""
    from iris.org_runner import run_org_analysis

    s = get_strings(args.lang)

    org_path = os.path.abspath(args.org)
    if not os.path.isdir(org_path):
        print(s["cli_error_org_not_dir"].format(path=args.org), file=sys.stderr)
        sys.exit(1)

    out_dir = os.path.join(os.path.abspath(args.out), f"{args.days}d")

    filter_repos = None
    if args.repos:
        filter_repos = [r.strip() for r in args.repos.split(",") if r.strip()]

    org_name = os.path.basename(os.path.normpath(org_path))

    print(f"Iris {VERSION}")
    print(f"{s['cli_org_banner']:<14}: {org_name}")
    print(f"{s['cli_banner_lookback']:<14}: {args.days} {s['unit_days']}")
    print(f"{s['cli_banner_churn']:<14}: {args.churn_days} {s['unit_days']}")
    print(f"{s['cli_banner_output']:<14}: {out_dir}")
    print()

    run_org_analysis(
        org_path=org_path,
        days=args.days,
        churn_days=args.churn_days,
        out_dir=out_dir,
        lang=args.lang,
        trend_enabled=args.trend,
        recent_days=args.recent_days,
        filter_repos=filter_repos,
    )


def _run_login(argv: list[str]) -> None:
    """Handle `iris login` — browser-based auth flow."""
    from iris.platform.auth import browser_login, manual_login

    # Parse optional flags
    server = None
    token = None
    i = 0
    while i < len(argv):
        if argv[i] == "--server" and i + 1 < len(argv):
            server = argv[i + 1]
            i += 2
        elif argv[i] == "--token" and i + 1 < len(argv):
            token = argv[i + 1]
            i += 2
        else:
            i += 1

    # Manual token login (for CI/CD)
    if token:
        s = server or os.environ.get("IRIS_SERVER_URL") or "https://iris.clickbus.com"
        if not manual_login(s, token):
            sys.exit(1)
        return

    # Browser login
    if not browser_login(server):
        sys.exit(1)


def _run_auth(argv: list[str]) -> None:
    """Handle `iris auth login|status|logout` subcommands."""
    from iris.platform.config import load_config, save_config, get_auth, get_org_slug

    if not argv:
        print("Usage: iris auth <login|status|logout>", file=sys.stderr)
        sys.exit(1)

    action = argv[0]

    if action == "login":
        # Delegate to the browser login flow
        _run_login(argv[1:])

    elif action == "status":
        auth = get_auth()
        if auth:
            server, token = auth
            org = get_org_slug()
            print(f"Server: {server}")
            print(f"Token:  {token[:12]}...")
            if org:
                print(f"Org:    {org}")
        else:
            print("Not authenticated. Run: iris login")

    elif action == "logout":
        config = load_config()
        config.pop("token", None)
        config.pop("org_slug", None)
        save_config(config)
        print("Logged out. Token and org removed from config.")

    else:
        print(f"Unknown auth action: {action}", file=sys.stderr)
        print("Usage: iris auth <login|status|logout>", file=sys.stderr)
        sys.exit(1)


def _run_pr(argv: list[str]) -> None:
    """Handle `iris pr [number] [--comment] [--no-context] [--churn-days N]`."""
    import argparse as _argparse
    import subprocess

    from iris.ingestion.github_reader import is_gh_available, read_single_pr

    if not is_gh_available():
        print("Error: GitHub CLI (gh) is required for PR analysis.", file=sys.stderr)
        print("Install it: https://cli.github.com", file=sys.stderr)
        sys.exit(1)

    parser = _argparse.ArgumentParser(prog="iris pr", description="Analyze a PR and output insights")
    parser.add_argument("number", nargs="?", type=int, default=None, help="PR number (auto-detected if omitted)")
    parser.add_argument("--comment", action="store_true", help="Post insights as a PR comment")
    parser.add_argument("--no-context", action="store_true", help="Skip repo history analysis (faster)")
    parser.add_argument("--churn-days", type=int, default=14, help="Context window in days (default: 14)")
    args = parser.parse_args(argv)

    repo_path = os.getcwd()

    # Auto-detect PR number from current branch
    pr_number = args.number
    if pr_number is None:
        try:
            result = subprocess.run(
                ["gh", "pr", "view", "--json", "number", "-q", ".number"],
                capture_output=True, text=True, check=True, cwd=repo_path,
            )
            pr_number = int(result.stdout.strip())
        except (subprocess.CalledProcessError, ValueError):
            print("Error: no PR found for current branch. Specify a number: iris pr <number>", file=sys.stderr)
            sys.exit(1)

    # Fetch PR metadata
    print(f"Analyzing PR #{pr_number}...", file=sys.stderr)
    pr = read_single_pr(repo_path, pr_number)
    if not pr:
        print(f"Error: could not fetch PR #{pr_number}.", file=sys.stderr)
        sys.exit(1)

    # Read PR commits from local git history
    from iris.ingestion.git_reader import read_pr_commits

    pr_commits = read_pr_commits(repo_path, [r.hash for r in pr.commit_refs])
    if not pr_commits:
        print(f"Warning: no commits found in local history for PR #{pr_number}.", file=sys.stderr)

    # Optional: read recent repo context for churn/cascade insights
    context_commits = None
    if not args.no_context and pr_commits:
        from iris.ingestion.git_reader import read_commits

        context_commits = read_commits(repo_path, days=args.churn_days)

    # Analyze
    from iris.analysis.pr_insights import analyze_pr
    from iris.reports.pr_comment import format_pr_comment

    result = analyze_pr(pr, pr_commits, context_commits, churn_days=args.churn_days)
    markdown = format_pr_comment(result)

    if args.comment:
        # Post as PR comment
        try:
            subprocess.run(
                ["gh", "pr", "comment", str(pr_number), "--body", markdown],
                check=True, cwd=repo_path,
            )
            print(f"Comment posted on PR #{pr_number}.", file=sys.stderr)
        except subprocess.CalledProcessError:
            print(f"Error: failed to post comment on PR #{pr_number}.", file=sys.stderr)
            print(markdown)
            sys.exit(1)
    else:
        print(markdown)


def _run_push(argv: list[str]) -> None:
    """Handle `iris push [metrics.json]` subcommand."""
    from iris.platform.config import get_auth
    from iris.platform.push import push_metrics

    auth = get_auth()
    if not auth:
        print("Not authenticated. Run: iris auth login", file=sys.stderr)
        sys.exit(1)

    server, token = auth

    if not argv:
        print("Usage: iris push <metrics.json> [--repo <name>]", file=sys.stderr)
        sys.exit(1)

    metrics_path = argv[0]
    if not os.path.exists(metrics_path):
        print(f"File not found: {metrics_path}", file=sys.stderr)
        sys.exit(1)

    # Parse optional --repo flag
    repo_name = None
    if "--repo" in argv:
        idx = argv.index("--repo")
        if idx + 1 < len(argv):
            repo_name = argv[idx + 1]

    # Infer repo name from filename if not provided
    if not repo_name:
        basename = os.path.basename(metrics_path)
        # Pattern: {org}-{repo}-metrics.json
        if basename.endswith("-metrics.json"):
            parts = basename[:-len("-metrics.json")].split("-", 1)
            repo_name = parts[1] if len(parts) > 1 else parts[0]
        else:
            repo_name = basename.replace(".json", "")

    # Opportunistic remote_url detection — cwd may or may not be a repo
    # for a standalone `iris push <file>`. When it is, sending it lets
    # the platform populate `repositories.remote_url` for DORA matching.
    remote_url = _git_remote_url(os.getcwd())

    print(f"Pushing to {server}...")
    print(f"Repository: {repo_name}")

    try:
        result = push_metrics(
            server_url=server,
            token=token,
            repository=repo_name,
            metrics_path=metrics_path,
            remote_url=remote_url,
            cli_version=VERSION,
        )
        print(f"Push successful.")
        print(f"  Run ID:  {result.get('run_id', 'unknown')}")
        print(f"  Repo ID: {result.get('repository_id', 'unknown')}")
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def _push_after_analysis(
    metrics_path: str,
    repo_name: str,
    window_days: int,
    repo_path: str | None = None,
    active_users: list | None = None,
) -> None:
    """Push metrics to platform after analysis."""
    from iris.platform.config import get_auth, get_github_user
    from iris.platform.push import push_metrics

    auth = get_auth()
    if not auth:
        print("\n--push: Not authenticated. Run: iris login")
        return

    server, token = auth
    github_user = get_github_user()
    # Send the git remote URL so the platform can normalize it against
    # external DORA event `dd_repository_id` for per-repo matching.
    # Without this, `repositories.remote_url` stays NULL and the
    # Datadog sync ingests all of this repo's deploys with
    # `repository_id = NULL`.
    remote_url = _git_remote_url(repo_path) if repo_path else None
    print(f"\nPushing to {server}...", end=" ", flush=True)

    try:
        result = push_metrics(
            server_url=server,
            token=token,
            repository=repo_name,
            metrics_path=metrics_path,
            window_days=window_days,
            remote_url=remote_url,
            github_user=github_user,
            active_users=active_users,
            cli_version=VERSION,
        )
        print(f"done. (run: {result.get('run_id', '?')[:8]})")
    except RuntimeError as e:
        print(f"\n[ERROR] Push failed — metrics were NOT sent to the platform.", file=sys.stderr)
        print(f"        {e}", file=sys.stderr)


def _run_hook(argv: list[str]) -> None:
    """Handle `iris hook install|uninstall|status` subcommands."""
    from iris.hooks.manager import install, install_push_hook, uninstall, uninstall_push_hook, status

    if not argv:
        print("Usage: iris hook <install|uninstall|status> [repo_path]", file=sys.stderr)
        sys.exit(1)

    action = argv[0]
    repo_path = os.path.abspath(argv[1]) if len(argv) > 1 else os.getcwd()

    if action == "install":
        try:
            hook_path = install(repo_path)
            print(f"Iris hook installed: {hook_path}")
            print("AI agent detection enabled for: $AI_AGENT, $CLAUDE_CODE, $CURSOR_SESSION, $WINDSURF_SESSION")
        except FileExistsError:
            print("Iris hook is already installed.")
        except FileNotFoundError as e:
            print(str(e), file=sys.stderr)
            sys.exit(1)
        # Always install push hook alongside the main hook
        try:
            install_push_hook(repo_path)
            print("Auto-push hook installed (daily report on first commit).")
        except FileExistsError:
            pass

    elif action == "uninstall":
        removed = uninstall(repo_path)
        removed_push = uninstall_push_hook(repo_path)
        if removed or removed_push:
            print("Iris hooks removed.")
        else:
            print("Iris hooks are not installed.")

    elif action == "status":
        info = status(repo_path)
        if info["installed"]:
            print(f"Iris hook: installed")
            print(f"Hook path:   {info['hook_path']}")
        else:
            print(f"Iris hook: not installed")
            print(f"Hooks dir:   {info['hooks_dir']}")

    else:
        print(f"Unknown hook action: {action}", file=sys.stderr)
        print("Usage: iris hook <install|uninstall|status> [repo_path]", file=sys.stderr)
        sys.exit(1)


def _run_uninstall() -> None:
    """Remove Iris from the system."""
    import shutil

    install_dir = os.path.expanduser("~/.iris")
    local_bin_wrapper = os.path.expanduser("~/.local/bin/iris")
    legacy_bin_wrapper = os.path.join(install_dir, "bin", "iris")

    print("")
    print("  This will remove Iris from your machine:")
    print("")
    if os.path.isdir(install_dir):
        print(f"    - Delete {install_dir}/ (venv, config)")
    else:
        print(f"    - {install_dir}/ not found")
    if os.path.isfile(local_bin_wrapper):
        print(f"    - Remove wrapper at ~/.local/bin/iris")

    # Check shell rc files for PATH entry (both new and legacy locations)
    shell_rc_files = [
        os.path.expanduser("~/.zshrc"),
        os.path.expanduser("~/.bash_profile"),
        os.path.expanduser("~/.bashrc"),
        os.path.expanduser("~/.profile"),
    ]
    rc_with_iris = []
    for rc in shell_rc_files:
        if os.path.isfile(rc):
            with open(rc) as f:
                content = f.read()
                # Legacy PATH entry or any Iris-marked block
                if ".iris/bin" in content or "# Iris" in content:
                    rc_with_iris.append(rc)

    if rc_with_iris:
        print(f"    - Remove PATH entry from: {', '.join(rc_with_iris)}")

    # Check pipx
    is_pipx = False
    if not os.path.isdir(install_dir):
        # Might be installed via pipx
        pipx_path = os.path.expanduser("~/.local/pipx/venvs/iris")
        if os.path.isdir(pipx_path):
            is_pipx = True
            print(f"    - Uninstall pipx package: iris")

    print("")
    try:
        reply = input("  Proceed? [y/N] ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n  Cancelled.")
        return

    if reply.lower() not in ("y", "yes"):
        print("  Cancelled.")
        return

    # Remove install dir
    if os.path.isdir(install_dir):
        shutil.rmtree(install_dir)
        print(f"  Removed {install_dir}/")

    # Remove wrapper at ~/.local/bin/iris if it points to our venv
    if os.path.isfile(local_bin_wrapper):
        try:
            with open(local_bin_wrapper) as f:
                if "/.iris/venv/" in f.read():
                    os.remove(local_bin_wrapper)
                    print(f"  Removed {local_bin_wrapper}")
        except OSError:
            pass

    # Clean shell rc files
    for rc in rc_with_iris:
        with open(rc) as f:
            lines = f.readlines()
        with open(rc, "w") as f:
            skip_next = False
            for line in lines:
                if "# Iris" in line:
                    skip_next = True
                    continue
                if skip_next and (".iris/bin" in line or ".local/bin" in line):
                    skip_next = False
                    continue
                skip_next = False
                f.write(line)
        print(f"  Cleaned {rc}")

    # Pipx uninstall
    if is_pipx:
        os.system("pipx uninstall iris 2>/dev/null")
        print("  Uninstalled pipx package")

    print("")
    print("  Iris has been removed. Restart your terminal to complete.")
    print("")


def _run_upgrade() -> None:
    """Upgrade Iris CLI by delegating to the same install.sh the user already
    used. install.sh is the single source of truth for resolving the latest
    version (GitHub Releases API), detecting pipx vs pip, and doing the
    correct uninstall-then-install dance on pipx — duplicating that logic
    here drifts immediately."""
    import subprocess

    # Resolve which deployment served the install. Priority: env override,
    # then ~/.iris/config.json (written by install.sh at install time),
    # then localhost as a last-resort default.
    config_server = ""
    try:
        from iris.platform.config import load_config

        config_server = load_config().get("server_url", "") or ""
    except Exception:
        pass
    server_url = (
        os.environ.get("IRIS_SERVER_URL") or config_server or "https://iris.clickbus.com"
    ).rstrip("/")

    install_url = f"{server_url}/install.sh"
    print(f"\n  Iris {VERSION}")
    print(f"  Running installer from {install_url}\n")

    try:
        subprocess.run(
            f"curl -fsSL '{install_url}' | sh",
            shell=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"  Upgrade failed: {e}", file=sys.stderr)
        sys.exit(1)


def main(argv: list[str] | None = None) -> None:
    # Intercept subcommands before argparse (they use different arg structures)
    raw_argv = argv if argv is not None else sys.argv[1:]
    if raw_argv and raw_argv[0] in ("--version", "-V"):
        print(f"Iris {VERSION}")
        return
    if raw_argv and raw_argv[0] == "upgrade":
        _run_upgrade()
        return
    if raw_argv and raw_argv[0] == "uninstall":
        _run_uninstall()
        return
    if raw_argv and raw_argv[0] == "hook":
        _run_hook(raw_argv[1:])
        return
    if raw_argv and raw_argv[0] == "login":
        _run_login(raw_argv[1:])
        return
    if raw_argv and raw_argv[0] == "auth":
        _run_auth(raw_argv[1:])
        return
    if raw_argv and raw_argv[0] == "push":
        _run_push(raw_argv[1:])
        return
    if raw_argv and raw_argv[0] == "pr":
        _run_pr(raw_argv[1:])
        return

    args = parse_args(argv)
    s = get_strings(args.lang)

    # Validate mutually exclusive modes
    if args.org and args.repo_path:
        print(s["cli_error_org_mutex"], file=sys.stderr)
        sys.exit(1)

    if args.org:
        _run_org(args)
    elif args.repo_path:
        _run_single_repo(args)
    else:
        print("Error: either repo_path or --org is required.", file=sys.stderr)
        sys.exit(1)
