export const translations = {
  "en-US": {
    common: {
      cancel: "Cancel",
      error: "Error",
      close: "Close",
      loading: "Loading...",
    },
    navigation: {
      dashboard: "Dashboard",
      repositories: "Repositories",
      compare: "Compare",
      aiExposure: "AI Exposure",
      team: "Team",
      auditLog: "Audit Log",
      profile: "Profile",
      settings: "Settings",
      organizationSettings: "Organization Settings",
      profileAndSettings: "Profile & Settings",
      myAiUsage: "My AI usage",
      signOut: "Sign out",
      createOrganization: "Create Organization",
      organizations: "Organizations",
      openMenu: "Open navigation menu",
    },
    publicNav: {
      faq: "FAQ",
      deck: "Deck",
      signIn: "Sign In",
      getStarted: "Get Started",
      openMenu: "Open main menu",
      githubAria: "GitHub",
    },
    home: {
      hero: {
        badge: "Now in Early Access",
        title: "Engineering intelligence for the AI era",
        description:
          "Measure what survives, not what ships. Iris analyzes your Git repos and reveals whether AI is making your code more durable — or just more. Detects Copilot, Claude, Cursor, Windsurf, and other AI tools automatically.",
        ctaPrimary: "Get Started",
        ctaSecondary: "See a Report",
        terminalCaption: "delivery-pulse.md",
      },
      problem: {
        title: "Is the code actually better — or just more?",
        description:
          "Your team adopted AI coding tools. Commits increased. PRs are faster. Traditional metrics say things are great. But you can't see what's breaking underneath.",
        oldVelocity: "Velocity",
        oldThroughput: "Throughput",
        oldCycleTime: "Cycle time",
        newStabilization: "Stabilization",
        newDurability: "Durability",
        newSignalNoise: "Signal vs Noise",
      },
      provenData: {
        eyebrow: "Proven on real data",
        description:
          "Validated on an organization with 58 repos, 3,497 commits, and 1,211 merged PRs.",
        stat1Label: "AI code stabilization vs human code",
        stat2Label: 'of "human" commits match AI velocity patterns',
        stat3Label: "coupling detected across 4 client implementations",
        stat4Label: "burst explained by weekly timeline",
      },
      howItWorks: {
        title: "How it works",
        installLabel: "1. Install",
        runLabel: "2. Run",
        readLabel: "3. Read",
        readDescription:
          "Get a Markdown report + JSON metrics with delivery pulse, churn investigation, and AI impact analysis.",
        prLabel: "Optional: Review PRs",
        prDescription:
          "Analyze any PR for AI composition, churn risk, and cascade risk. Posts insights as a PR comment.",
      },
      modules: {
        title: "17 analysis modules",
        catAI: "AI Impact",
        catTemporal: "Temporal Intelligence",
        catStructural: "Structural Analysis",
        catInfra: "Infrastructure",
        items: {
          originClassifier:
            "Human / AI-Assisted / Bot attribution by tool (Copilot, Claude, Cursor, Windsurf)",
          codeDurability: "Line survival rate by origin and tool",
          correctionCascades: "Fix-following patterns by origin and tool",
          fixTargeting: "Which origin's code attracts the most bug fixes",
          acceptanceRate: "Code review survival by tool",
          originFunnel: "Commit → PR → Stabilized → Surviving",
          attributionGap: "Unattributed high-velocity detection",
          prInsights: "Single-PR analysis with churn and cascade risk",
          activityTimeline: "Weekly breakdown with delivery pulse",
          trendAnalysis: "Baseline vs recent comparison",
          patternDetection: "Burst, quiet periods, intent shifts",
          stabilityMap: "Per-directory stabilization",
          churnInvestigation: "Chains + file coupling detection",
          commitShape: "Structural profile by origin",
          deliveryVelocity: "Speed vs durability correlation",
          primingDetection: "AI context files (CLAUDE.md, etc.)",
          attributionHook: "prepare-commit-msg for AI tools",
        },
      },
      positioning: {
        title: "What Iris is not",
        notSurveillanceTitle: "Not a developer surveillance tool",
        notSurveillanceDesc: "Analyzes systems, never individuals",
        notRealtimeTitle: "Not a real-time dashboard",
        notRealtimeDesc: "Point-in-time reports, not live monitoring",
        notIdeTitle: "Not an IDE plugin",
        notIdeDesc: "Works from Git history alone",
        notProductivityTitle: "Not a productivity tracker",
        notProductivityDesc: "Measures durability, not speed",
      },
      cta: {
        title: "Try it now",
        description: "One command. Runs locally. Cloud platform optional.",
        copy: "Copy",
        copied: "Copied!",
        requirements: "Python 3.11+ · Git · Zero dependencies",
      },
    },
    faqPage: {
      title: "Frequently asked questions",
      subtitle:
        "Everything you need to know about Iris. Can't find what you're looking for?",
      questions: {
        whatIsTitle: "What does Iris measure?",
        whatIsAnswer:
          "Iris analyzes your Git history to surface delivery-quality signals: stabilization, code durability, fix cascades, attribution gaps, and AI impact. Reports are point-in-time, not live monitoring.",
        howWorksTitle: "How does the analysis work?",
        howWorksAnswer:
          "Run the CLI against any repo. It reads commits, PRs and code-survival data locally and produces a Markdown report + JSON metrics. Zero dependencies on cloud services for the engine itself.",
        aiToolsTitle: "Which AI tools does it detect?",
        aiToolsAnswer:
          "Copilot, Claude, Cursor, Windsurf, and other AI assistants are detected via commit metadata, co-author trailers and velocity patterns. New tools can be added via the prepare-commit-msg hook.",
        privacyTitle: "Does Iris read my code?",
        privacyAnswer:
          "The engine runs locally and only inspects Git metadata and diffs. Nothing leaves your machine unless you connect to the optional cloud platform for cross-repo aggregation.",
        individualsTitle: "Does it rank or score developers?",
        individualsAnswer:
          "No. Iris is explicitly designed to analyze systems, never individuals. There is no productivity ranking, no per-author leaderboard, and no individual scoring.",
        platformTitle: "What does the cloud platform add?",
        platformAnswer:
          "The platform aggregates metrics across repos and over time, offers org-wide dashboards, change detection, and cross-repo comparison. The CLI alone is fully usable without it.",
        installTitle: "How do I install it?",
        installAnswer:
          "Run the install script (curl -fsSL {appUrl}/install.sh | sh) or pipx install iris. Requires Python 3.11+ and Git.",
        priceTitle: "How much does it cost?",
        priceAnswer:
          "The CLI is free and open. The cloud platform is in early access with usage-based pricing — contact us for details.",
        contributeTitle: "How can I contribute or report issues?",
        contributeAnswer:
          "The project is on GitHub at RocketBus/clickbus-iris. Issues and PRs are welcome.",
      },
    },
    setupLinked: {
      mirroring: "Will mirror @{login} from GitHub when you create",
      changeChoice: "Pick a different GitHub org",
      unlink: "Create without linking to GitHub",
    },
    selectGitHubOrg: {
      title: "Pick the GitHub organization to track",
      subtitle:
        "We'll create your Iris workspace mirroring this GitHub org. You can add more later.",
      loading: "Loading your GitHub organizations...",
      empty:
        "You don't have any GitHub organizations Iris can see. You can create a workspace manually.",
      manual: "Create a workspace manually instead",
      noLink:
        "You're not signed in with GitHub. Sign in with GitHub to use this flow.",
      error:
        "Couldn't fetch your GitHub organizations. Try again or fall back to manual setup.",
      select: "Continue",
    },
    welcomeGuide: {
      title: "First 15 minutes with Iris",
      subtitle:
        "A short read so you know what you're looking at — and what you're not.",
      whatItMeasures: {
        title: "What Iris measures",
        item1:
          "Stabilization — does the code that ships actually persist, or get rewritten?",
        item2:
          "AI impact — durability, cascades and acceptance, broken down by AI vs human commits.",
        item3:
          "Delivery shape — intent mix, PR health, churn hotspots, attribution gaps.",
      },
      whatItIsNot: {
        title: "What it is not",
        item1:
          "Not a productivity tracker — there is no individual ranking or score.",
        item2:
          "Not a real-time monitor — reports are point-in-time, not live alerts.",
        item3: "Not an IDE plugin — Iris reads Git history, nothing more.",
      },
      steps: {
        title: "Your first three steps",
        step1Title: "Sign up & create an org",
        step1Desc: "You're past this — well done.",
        step2Title: "Connect a repo",
        step2Desc:
          "Use the CLI to push your first analysis. The /connect page in any org walks you through it.",
        step3Title: "Read your first dashboard",
        step3Desc:
          "Once data lands, the org dashboard surfaces health, AI vs human, and the views below.",
      },
      whereToLook: {
        title: "Where to look first",
        intro: "These are the highest-signal views once you have data:",
        shadowAI:
          "Shadow AI Exposure — commits that look AI-generated but aren't attributed.",
        adoption:
          "AI Delivery Timeline — what changed after AI adoption began.",
        healthMap:
          "Health Map — which repos are rewriting more than they ship.",
      },
      footer:
        "Everything here treats your codebase as the system under study, never individuals. See CLAUDE.md and docs/PRINCIPLES.md if you want the deeper rationale.",
      cta: "Got it, take me to my dashboard",
      skip: "Skip",
      error: "Couldn't save your preference. Please try again.",
    },
    meAiUsage: {
      title: "Your AI usage",
      subtitle:
        "A quiet self-reflection on your own commit patterns. Only you see this page.",
      noOrgs:
        "You're not part of any organization yet. Join one to see your data here.",
      noMatch:
        "We couldn't match your name ({name}) against any commit author across your organizations. If you commit under a different name in Git, this view will populate once you sync.",
      privacyNote:
        "This page is strictly self-only. There is no ranking, no comparison with peers, and no admin can open it for someone else.",
      summary: {
        repos: "Repos with your activity",
        orgs: "Organizations",
        avgAi: "Avg AI-assisted",
        hvWeeks: "High-velocity weeks",
      },
      trend: {
        title: "AI-assisted share over time",
        subtitle: "Weekly average across the repos where you contributed.",
        empty: "Not enough data yet to draw a trend.",
      },
      perRepo: {
        title: "Repos where you used AI most",
        subtitle: "Sorted by AI-assisted commit share.",
        repo: "Repository",
        org: "Organization",
        commits: "Commits",
        aiPct: "AI %",
        hvWeeks: "HV weeks",
        lastSeen: "Last seen",
        nameMatchBadge: "name-only",
        nameMatchWarning:
          "Matched by author name, not email — verify this is really you.",
      },
      coverageNote:
        "Tool-level and intent-level breakdowns per author aren't in the engine yet. When they are, this page will pick them up automatically.",
    },
    roles: {
      owner: "Owner",
      admin: "Admin",
      member: "Member",
    },
    dashboard: {
      pulse: {
        totalCommits: "Total Commits",
        prsMerged: "PRs Merged",
        activeRepos: "Active Repos",
        contributors: "Contributors",
        avgStabilization: "Avg. Stabilization",
        aiAdoption: "AI Adoption",
      },
      quality: {
        title: "Delivery Quality",
        subtitle: "Quality signals across {count} repositories",
        distributionTitle: "Stabilization Distribution",
        distributionSubtitle:
          "Per-repo stabilization ratio — dispersion across the org",
        stabTooltip: "Stabilization: {pct}%",
        revertRate: "Revert Rate",
        cascadeRate: "Cascade Rate",
        fixLatency: "Fix Latency",
        newCodeChurn: "New Code Churn (2w)",
      },
      dora: {
        title: "DORA",
        sourceBadge: "Datadog",
        subtitle:
          "Deployment metrics for the org over the last 30 days, sourced directly from Datadog.",
        metrics: {
          cfr: "Change Failure Rate",
          mttrPerDeploy: "MTTR (per failed deploy)",
          deployFrequency: "Deploy Frequency",
          leadTime: "Lead Time",
          deploymentsTotal: "Deployments",
          deploymentsTotalHint: "{failed} failed in the window",
          rollbackRate: "Rollback Rate",
          rollbackRateHint: "{count} rollbacks of failed deploys",
          pending: "Pending Evaluation",
          pendingHint: "Datadog hasn't classified these yet",
        },
        correlation: {
          title: "Change Failure Rate by Code Origin",
          subtitle:
            "Per-commit join of Datadog deploys to local origin classification. Requires ≥ {threshold} failed deploys for signal.",
          cfrHeader: "CFR by origin",
          rollbackHeader: "Rollback rate by origin",
          cfrDenominator: "({failed} failed / {evaluated} evaluated)",
          rollbackDenominator: "({rollbacks} of {failed} failed)",
          insufficient:
            "Need at least {threshold} failed deploys for the AI-vs-human comparison. Currently {actual}.",
          origin: {
            HUMAN: "Human",
            AI_ASSISTED: "AI-Assisted",
            BOT: "Bot",
          },
        },
      },
      aiVsHuman: {
        title: "AI vs Human",
        subtitle: "How AI-assisted code compares across {count} repositories",
        commitMixTitle: "Commit Mix",
        commitMixSubtitle: "Human vs AI-assisted commits over time (org-wide)",
        human: "Human",
        ai: "AI-Assisted",
        bot: "Bot",
        qualityComparisonTitle: "Quality Comparison",
        qualityComparisonSubtitle: "Aggregated across all repos with AI data",
        stabilization: "Stabilization",
        codeDurability: "Code Durability",
        cascadeRate: "Cascade Rate",
        toolsTitle: "AI Tools",
        toolsSubtitle: "Tools detected across the org",
        toolsTooltip: "{count} repos",
        toolsDetectedIn: "Detected in",
        attributionGapTitle: "Attribution Gap",
        attributionGapDescription:
          "{flagged} of {total} human commits show AI-like patterns but lack attribution",
        attributionGapCta: "See Shadow AI Exposure →",
      },
      intent: {
        title: "Intent Distribution",
        subtitle:
          "What kind of changes are being made across {count} repositories",
        commitIntentsTitle: "Commit Intents",
        commitIntentsSubtitle: "Aggregated across all repos",
        intentTrendTitle: "Intent Trend",
        intentTrendSubtitle: "Weekly intent mix over time",
        featureToFix: "Feature-to-Fix Ratio",
        buildingMore: "Building more than fixing",
        fixingMore: "Fixing more than building",
        labels: {
          feature: "Feature",
          fix: "Fix",
          refactor: "Refactor",
          config: "Config",
          unknown: "Unknown",
        },
      },
      prHealth: {
        title: "PR Health",
        subtitle: "Pull request metrics across {count} repositories",
        prsMerged: "PRs Merged",
        timeToMerge: "Time to Merge",
        singlePassRate: "Single-Pass Rate",
        reviewRounds: "Review Rounds",
        byOriginTitle: "PR Acceptance by Origin",
        byOriginSubtitle: "How AI-assisted PRs compare to human PRs",
        origin: "Origin",
        human: "Human",
        ai: "AI-Assisted",
      },
      cycleTime: {
        title: "Cycle Time",
        subtitle:
          "How long engineering takes to deliver, from PR open to merge.",
        insight:
          "Engineering ships fast. {pct} of PRs are merged within a day. Median cycle time is {median}. Lead-time bottlenecks live before (demand/product) and after (infra, environments, deploy) — not in code execution.",
        kpi: {
          pctWithin24h: "PRs merged within 1 day",
          median: "Median cycle time",
          mean: "Mean cycle time",
          p90: "P90 cycle time",
        },
        charts: {
          ranking: {
            title: "% PRs Merged within 1 Day — by Repo",
            subtitle: "Higher is faster",
          },
          distribution: {
            title: "Cycle Time Distribution — by Repo",
            subtitle: "Stacked: more teal/green means faster",
          },
        },
        buckets: {
          sameDay: "Same day",
          oneDay: "1 day",
          twoThree: "2–3 days",
          fourSeven: "4–7 days",
          sevenPlus: "7+ days",
        },
        tooltips: {
          ranking: "{merged} merged PRs",
        },
      },
      healthMap: {
        title: "Health Map",
        subtitle: "Repository size by commits, colored by stabilization",
        tooltip: "{pct}% stab · {commits} commits",
        improving: "Improving",
        worsening: "Worsening",
        noChanges: "No significant changes detected",
      },
      orgTimeline: {
        title: "Org Timeline",
        subtitle: "Weekly activity across all repositories",
        commits: "Commits",
        stabilization: "Stabilization",
        aiAdoption: "AI Adoption",
      },
      hyperEngineers: {
        title: "Hyper Engineers",
        subtitle:
          "Contributors with high velocity or 80%+ AI adoption across the org",
        badge: "Hyper Engineer",
        repos: "{count} repos",
      },
      repoList: {
        empty: "No repositories yet.",
        searchPlaceholder: "Search repositories...",
      },
    },
    investHere: {
      title: "Where to invest",
      subtitle:
        "Systemic patterns that drive the most rework in this repository.",
      empty:
        "No systemic hotspots detected. Stabilization, coupling and fix distribution all look within healthy ranges.",
      severityHigh: "High",
      severityMedium: "Medium",
      severityLow: "Low",
      weakDirectoryTitle: "Weak directory: {directory}",
      weakDirectoryReason:
        "Code here stabilizes at {ratio}% across {files} files touched. The directory absorbed {churn} churn events — rework concentrates here.",
      tightCouplingTitle: "Tight coupling",
      tightCouplingReason:
        "{fileA} and {fileB} change together {rate}% of the time ({count} joint changes). Decoupling would reduce rework cost across the area.",
      fixMagnetTitle: "{origin} attracts fixes",
      fixMagnetReason:
        "Commits from {origin} represent {codeShare}% of changes but {fixShare}% of fixes ({disp}× the baseline, {count} fixes in window). Review patterns may need adjustment for this origin.",
      hypothesisNote:
        "These are systemic hypotheses derived from commit history. They point to where attention may reduce rework, not to who is responsible.",
    },
    adoption: {
      title: "AI Delivery Timeline",
      subtitle:
        "What changed in this repository after AI-assisted commits began.",
      orgTitle: "AI Delivery Timeline",
      orgSubtitle:
        "Repositories where AI adoption was detected and how delivery quality shifted since.",
      orgEmpty: "No AI adoption events detected yet across this organization.",
      empty:
        "No AI adoption event detected. Install the Iris hook or commit with AI attribution to surface this view.",
      insufficient:
        "Collecting data: {count} AI commits seen so far (need at least 5 to analyze pre/post deltas).",
      detected: "AI adoption detected on {date} ({count} AI commits)",
      hypothesisNote:
        "Deltas compare pre-adoption and post-adoption windows. Correlation, not causation — other changes may have overlapped.",
      confidence: {
        clear: "Clear",
        sparse: "Sparse",
        insufficient: "Insufficient",
      },
      columns: {
        metric: "Metric",
        pre: "Pre-adoption",
        post: "Post-adoption",
        delta: "Delta",
        repository: "Repository",
        detected: "Detected",
        stabilizationDelta: "Stabilization Δ",
        aiCommits: "AI commits",
      },
      metrics: {
        stabilization: "Stabilization ratio",
        durability: "Durability (line survival)",
        cascade: "Cascade rate",
        revert: "Revert rate",
        newCodeChurn: "New-code churn (4w)",
      },
    },
    toolComparison: {
      title: "AI Tool Comparison",
      subtitle:
        "Quality signals side-by-side across AI tools used in your codebase.",
      columnTool: "Tool",
      columnCommits: "Commits",
      columnDurability: "Durability",
      columnCascade: "Cascade",
      columnRevert: "Revert",
      columnSinglePass: "Single-pass PR",
      belowThreshold: "below threshold",
      thresholdNote:
        "Rows with fewer than {threshold} commits are marked as low-confidence and sorted to the bottom.",
      noSignificant:
        "No tool has enough commits yet to produce a meaningful comparison (minimum {threshold}).",
    },
    connect: {
      title: "Connect your first repository",
      subtitle:
        "Get your first insight in under 5 minutes. Three short commands from your terminal.",
      alreadyConnected:
        "You already have {count} {repoLabel} connected. You can still add more from the CLI.",
      repoSingular: "repository",
      repoPlural: "repositories",
      goToDashboard: "Go to dashboard",
      emptyStateLink: "Connect your first repository",
      step1Label: "Install the CLI",
      step1Hint: "macOS, Linux, or WSL",
      step1Alt: "Using pipx? Run",
      step2Label: "Log in from your terminal",
      step2Hint: "Opens a browser tab to authorize this organization.",
      step3Label: "Analyze a repository",
      step3Hint: "Point the CLI at any local Git repository.",
      waiting: "Waiting for the first ingest…",
      waitingHint: "We check every 5 seconds. Leave this tab open.",
      detected: "First signal captured — redirecting…",
      copy: "Copy",
      copied: "Copied",
    },
    repos: {
      title: "Repositories",
      subtitle: "{count} repositories in {org}",
      deleteButton: "Delete repository",
      deleteDialog: {
        title: "Delete Repository",
        description:
          "This will permanently delete the repository {name} and all of its analysis runs and metrics. This action cannot be undone.",
        warning:
          "Deleting a repository is irreversible. All historical runs, metrics, and insights for this repository will be permanently removed.",
        confirmLabel: "Type {name} to confirm",
        confirmButton: "Delete Repository Permanently",
        success: "Repository deleted successfully",
        error: "Failed to delete repository",
        mismatch: "Confirmation text must match the repository name",
      },
      detail: {
        metrics: {
          stabilization: "Stabilization",
          revertRate: "Revert Rate",
          churnEvents: "Churn Events",
          commits: "Commits",
        },
        dora: {
          title: "DORA",
          subtitle:
            "Deployment metrics scoped to this repository over the last {days} days.",
          incidentDisclaimer:
            "MTTR by incident isn't shown per-repo — Datadog failure events don't carry repository attribution, so any per-repo number would be a misleading copy of the org-wide one. See the dashboard for the incident-level view.",
        },
        activeContributors: "Active Contributors",
        contributorsCount: "{count} contributor in the last analysis window",
        contributorsCountPlural:
          "{count} contributors in the last analysis window",
        runHistory: "Run History",
        runColumns: {
          date: "Date",
          commits: "Commits",
          window: "Window",
          cli: "CLI",
        },
      },
    },
    repoCharts: {
      stabilization: {
        title: "Stabilization Ratio",
        subtitle: "Percentage of files that persist without rework",
        label: "Stabilization",
      },
      intent: {
        title: "Intent Distribution",
        subtitle: "What kind of changes are being made",
        labels: {
          feature: "Feature",
          fix: "Fix",
          refactor: "Refactor",
          config: "Config",
          unknown: "Unknown",
        },
      },
      origin: {
        title: "Origin Distribution",
        subtitle: "Human vs AI-assisted commits",
        stabByOrigin: "Stabilization by origin",
        labels: {
          human: "Human",
          ai: "AI-Assisted",
          bot: "Bot",
        },
      },
      churn: {
        title: "Churn Events",
        subtitle: "Files modified repeatedly in short windows",
        label: "Churn",
      },
      aiAdoption: {
        title: "AI Adoption",
        subtitle: "AI-assisted commit coverage over time",
        label: "AI Coverage",
      },
      commits: {
        title: "Commits",
        subtitle: "Total commits per analysis run",
        label: "Commits",
      },
      cascades: {
        title: "Correction Cascades",
        subtitle: "Commits that trigger follow-up fixes",
        rate: "Cascade rate",
        medianDepth: "Median depth",
        depthFixes: "{value} fixes",
        byOrigin: "{pct}% ({cascades}/{total})",
      },
      durability: {
        title: "Code Durability",
        subtitle: "Line survival rate at HEAD",
        survival: "{pct}% survival",
        introduced: "{count} introduced",
        surviving: "{count} surviving",
        medianAge: "{days}d median age",
      },
      weeklyActivity: {
        title: "Weekly Activity",
        subtitle: "Per-week breakdown from latest analysis",
        columns: {
          week: "Week",
          commits: "Commits",
          loc: "LOC",
          feature: "Feature",
          fix: "Fix",
          aiPct: "AI%",
        },
      },
      flowLoad: {
        title: "Flow Load",
        subtitle:
          "WIP per ISO week — PRs in flight stacked by intent, with the count of distinct commit authors per week (engineering parallelism only; backlog, design, and local-branch work do not appear).",
        wipAxis: "PRs in flight",
        authorsAxis: "Authors / week",
        authorsLine: "Distinct authors",
        intentLabels: {
          FEATURE: "Feature",
          FIX: "Fix",
          REFACTOR: "Refactor",
          CONFIG: "Config",
          UNKNOWN: "Unknown",
        },
      },
      flowEfficiency: {
        title: "Flow Efficiency",
        subtitle:
          "Active vs wait time across the merged-PR lifecycle. Throughput says how much shipped; this says whether work flowed or queued.",
        efficiencyLabel: "Active fraction",
        ttfrLabel: "Time to first review",
        ttfrUnit: "h",
        phaseLabels: {
          coding: "Coding",
          awaiting_first_review: "Awaiting first review",
          in_review_active: "In review · active",
          in_review_wait: "In review · wait",
          awaiting_merge: "Awaiting merge",
        },
        byIntentTitle: "By intent",
      },
      aiImpact: {
        title: "AI Impact",
        subtitle: "How AI-assisted code compares to human code over time",
      },
      commitMix: {
        title: "Commit Mix",
        subtitle: "Human vs AI-assisted commits over time",
        human: "Human",
        ai: "AI-Assisted",
      },
      compare: {
        stabilizationTitle: "Stabilization",
        stabilizationSubtitle: "File persistence rate — Human vs AI",
        durabilityTitle: "Code Durability",
        durabilitySubtitle: "Line survival rate at HEAD — Human vs AI",
        cascadesTitle: "Correction Cascades",
        cascadesSubtitle: "Fix cascade trigger rate — Human vs AI",
      },
    },
    aiExposure: {
      title: "Shadow AI Exposure",
      subtitle:
        "How much AI-assisted code is being produced — and how much is attributed.",
      empty:
        "No origin data yet. Run the CLI on a repository to start measuring.",
      summary: {
        attributed: "Attributed AI",
        attributedHint:
          "Commits with an AI co-author trace (e.g. Copilot, Claude, Cursor)",
        estimated: "Estimated AI",
        estimatedHint:
          "Upper-bound: attributed commits plus human commits that match AI-like patterns",
        gap: "Shadow AI gap",
        gapHint:
          "Percentage points between estimated and attributed. Higher means more likely hidden AI.",
        baseline:
          "{flagged} of {total} human commits match ≥2 AI-like signals (burst, large diff, rapid succession, wide spread).",
        noSignal:
          "No shadow signal detected across repositories. Attribution coverage reflects the real AI usage captured in commit history.",
      },
      table: {
        title: "Repositories ranked by gap",
        name: "Repository",
        attributed: "Attributed",
        shadow: "Shadow signal",
        gap: "Gap",
        action: "",
        installHook: "Install hook",
        attributedOnly: "attributed",
        noSignal: "no signal",
      },
      install: {
        title: "Close the attribution gap",
        description:
          "Install the Iris prepare-commit-msg hook on {name} so AI-authored commits get co-author attribution going forward.",
        step1: "Log in from the CLI",
        step2: "Install the hook in the repository",
        step3: "Future AI commits will be attributed automatically",
        copy: "Copy",
        copied: "Copied",
        done: "Got it",
      },
      hypothesisNote:
        "These numbers are hypotheses, not truths. The shadow signal flags commits that match patterns seen in AI-assisted work; it does not prove AI authorship.",
    },
    team: {
      title: "Team",
      subtitle: "Manage your team members and their roles",
      memberActionsAriaLabel: "Member actions",
      members: "Members",
      pendingInvitations: "Pending Invitations",
      noMembers: "No team members yet.",
      inviteFirstMember: "Invite your first team member to get started.",
      inviteMember: "Invite Member",
      joinedAt: "Joined at",
      removeMember: "Remove Member",
      transferOwnership: "Transfer Ownership",
      inviteDialog: {
        title: "Invite Team Member",
        description: "Send an invitation to join your organization",
        emailLabel: "Email address",
        emailPlaceholder: "user@example.com",
        roleLabel: "Role",
        inviteButton: "Send Invitation",
        success: "Invitation sent successfully",
        error: "Failed to send invitation",
      },
      removeDialog: {
        title: "Remove Team Member",
        description:
          "Are you sure you want to remove {name} from this organization? This action cannot be undone and they will lose access to the organization.",
        confirmButton: "Remove Member",
        success: "Member removed successfully",
        error: "Failed to remove member",
      },
      changeRoleDialog: {
        changeButton: "Promote to",
        demoteButton: "Demote to",
        success: "Role changed successfully",
        error: "Failed to change role",
      },
      transferOwnershipDialog: {
        title: "Transfer Organization Ownership",
        description:
          "Are you sure you want to transfer ownership of this organization to {name} ({email})? You will become an Admin after this action. This cannot be undone.",
        warning:
          "Transferring ownership is a critical action. You will lose owner privileges and become an Admin.",
        newOwnerLabel: "New Owner",
        transferButton: "Transfer Ownership",
        success: "Ownership transferred successfully",
        error: "Failed to transfer ownership",
      },
      invitationCard: {
        invitedBy: "Invited by",
        expiresIn: "Expires in {days} days",
        expired: "Expired",
        cancelButton: "Cancel Invitation",
        resendButton: "Resend Invitation",
        cancelSuccess: "Invitation cancelled",
        resendSuccess: "Invitation resent",
        cancelDialog: {
          title: "Cancel Invitation",
          description:
            "Are you sure you want to cancel the invitation for {email}? They will no longer be able to use this invitation link to join the organization.",
          confirmButton: "Cancel Invitation",
        },
      },
      memberLabel: "member",
      membersLabel: "members",
      invitationLabel: "invitation",
      invitationsLabel: "invitations",
    },
    settings: {
      title: "Organization Settings",
      subtitle: "Manage your organization settings and preferences",
      integrations: {
        title: "Integrations",
        subtitle:
          "Connect external systems to bring deploy and incident data into the analysis.",
        footnote:
          "Coming soon. More providers will appear here as they're built out.",
        status: {
          notConnected: "Not connected",
          connected: "Connected",
          error: "Error",
          disconnected: "Disconnected",
        },
        providers: {
          datadog: {
            name: "Datadog",
            description:
              "Pull deployments and incidents from Datadog's DORA Metrics API.",
            detail:
              "Once connected, Iris will sync deployment and failure events daily and use them to compute real Change Failure Rate and MTTR alongside the git-derived estimates.",
          },
        },
        detail: {
          backLink: "Back to integrations",
          comingSoonTitle: "Coming soon",
          comingSoonDescription:
            "Connection flow, credentials, and sync configuration land in upcoming releases.",
        },
        datadog: {
          connectTitle: "Connect Datadog",
          connectDescription:
            "Provide a Datadog API key and Application key with the dora_metrics_read scope. We'll validate them against your tenant before saving.",
          connectButton: "Connect Datadog",
          connectSuccess: "Datadog connected successfully.",
          connectError: "Failed to connect Datadog.",
          errorTitle: "Datadog sync is failing",
          errorDescription:
            "Iris is still connected, but the most recent sync errored. Review the message below; once Datadog accepts the credentials again, the next cron run resumes ingestion.",
          connectedTitle: "Datadog is connected",
          connectedDescription:
            "Iris uses these credentials to sync deploys and incidents on a daily cadence.",
          disconnectButton: "Disconnect",
          disconnectSuccess:
            "Datadog disconnected. Historical data is preserved.",
          disconnectError: "Failed to disconnect Datadog.",
          fields: {
            apiKey: "API Key",
            appKey: "Application Key",
            appKeyHint:
              "The Application Key carries the user's permissions. Create one scoped to dora_metrics_read in Datadog's Application Keys settings.",
            site: "Datadog Site",
            lastSyncAt: "Last sync",
            connectedAt: "Connected at",
            neverSynced: "Never synced yet",
            unmatchedDeployments: "Unmatched deployments",
            unmatchedDeploymentsHint:
              "Deployments whose Datadog repository slug didn't resolve to a tracked Iris repo. Verify the Iris repo's remote URL matches the Datadog repository_id.",
            lastIncidentRegistered: "Last incident registered",
            lastIncidentNever: "No incidents registered yet",
            lastIncidentHint:
              "Most recent failure event ingested {days} day(s) ago. If this number keeps growing, check whether the Datadog DORA failure feed is still active.",
            lastIncidentNeverHint:
              "Datadog hasn't sent a failure event for this org yet. The MTTR per-incident metric stays empty until one lands.",
          },
          disconnectDialog: {
            title: "Disconnect Datadog?",
            description:
              "The credentials will be removed and the daily sync will stop. Deployments and incidents already ingested will remain in Iris. You can reconnect any time.",
            cancel: "Cancel",
            confirm: "Yes, disconnect",
          },
        },
      },
      dangerZone: "Danger Zone",
      deleteOrganizationDescription:
        "Irreversible and destructive actions for this organization",
      deleteOrganizationWarning:
        "Once you delete an organization, there is no going back. Please be certain.",
      deleteOrganizationButton: "Delete Organization",
      deleteOrganizationDialog: {
        title: "Delete Organization",
        description:
          "This action cannot be undone. This will permanently delete the organization {name} and all its associated data.",
        warning:
          "Deleting an organization is irreversible. All data, members, and settings will be permanently removed.",
        confirmLabel: "Type {name} to confirm",
        confirmButton: "Delete Organization Permanently",
        success: "Organization deleted successfully",
        error: "Failed to delete organization",
      },
      logoUpload: {
        title: "Organization Logo",
        description:
          "Upload a custom logo for {name}. This will appear in the top-left corner of all pages.",
        currentLogo: "Current Logo",
        customLogo: "Custom logo",
        defaultLogo: "Using default logo",
        changeLogo: "Change Logo",
        uploadLogo: "Upload Logo",
        uploading: "Uploading...",
        success: "Logo uploaded successfully",
        error: "Failed to upload logo",
        recommendedSize:
          "Recommended: Square image, max 5MB. Supported formats: JPEG, PNG, GIF, WebP, SVG",
      },
      renameOrganization: {
        title: "Organization Name",
        description:
          "Change the display name of your organization. The slug cannot be changed to avoid conflicts.",
        nameLabel: "Organization Name",
        namePlaceholder: "Enter organization name",
        nameHint: "The display name shown throughout the application",
        slugLabel: "Organization Slug",
        slugHint:
          "The slug cannot be changed as it is used in URLs. This helps prevent conflicts.",
        saveButton: "Save Changes",
        saving: "Saving...",
        success: "Organization name updated successfully",
        error: "Failed to update organization name",
        nameRequired: "Organization name is required",
        noChanges: "No changes to save",
      },
      autoAcceptDomain: {
        title: "Automatic Domain-Based Membership",
        description:
          "Allow people with the same verified email domain as your organization owners to join automatically.",
        toggleLabel: "Auto-accept members with the owner domain",
        enabledDescription:
          "Members using email addresses that end with {domain} are added automatically as members.",
        disabledDescription:
          "New members must be invited manually before they can join.",
        enabledToast:
          "Members with email addresses ending in {domain} will now join automatically.",
        disabledToast: "Automatic domain-based membership has been disabled.",
        error: "Failed to update automatic membership settings.",
        domainLabel: "Approved domain: {domain}",
        domainUnavailable: "Domain unavailable",
        denylistNotice:
          "Personal email domains (gmail, hotmail, etc.) are blocked automatically.",
      },
    },
    setup: {
      title: "Create Your Organization",
      description: "Get started by creating your first organization",
      organizationName: "Organization Name",
      organizationNamePlaceholder: "My Company",
      organizationSlug: "Organization Slug",
      organizationSlugPlaceholder: "my-company",
      organizationSlugDescription: "This will be used in your organization URL",
      createButton: "Create Organization",
      creating: "Creating...",
      nameRequired: "Organization name is required",
      slugInvalid:
        "Organization slug must be 3-50 characters long and contain only letters, numbers, and hyphens",
      error: "Failed to create organization",
      errorGithubOrgTaken:
        "This GitHub organization is already linked to a Iris workspace you are not a member of. Ask an existing member to invite you.",
    },
    auditLog: {
      title: "Audit Log",
      subtitle:
        "Track changes and sensitive actions performed across your organization.",
      emptyState: "No audit entries available yet.",
      systemActor: "System",
      noTarget: "No target",
      noMetadata: "No metadata recorded",
      viewMetadata: "View metadata",
      ipAddressLabel: "IP",
      userAgentLabel: "User agent",
      columns: {
        timestamp: "Timestamp",
        actor: "Actor",
        action: "Action",
        target: "Target",
        metadata: "Metadata",
        context: "Context",
      },
    },
    profile: {
      pageTitle: "Settings",
      pageSubtitle: "Manage your account settings and preferences",
      title: "Profile",
      subtitle: "Update your personal information",
      email: "Email",
      verified: "Verified",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      fullName: "Full Name",
      profileInformation: "Profile Information",
      changeAvatar: "Change avatar",
      uploadAvatar: "Upload Avatar",
      removeAvatar: "Remove",
      avatarStatus: {
        custom: "Using custom avatar",
        gravatar: "Using Gravatar",
        none: "Upload an avatar or set one up on Gravatar.com",
      },
      avatarUpload: {
        recommendedSize:
          "Recommended: Square image, max 5MB. Supported formats: JPEG, PNG, GIF, WebP, SVG",
        uploading: "Uploading...",
        success: "Avatar uploaded successfully",
        error: "Failed to upload avatar",
        removeSuccess: "Avatar removed successfully",
        removeError: "Failed to remove avatar",
      },
      updateSuccess: "Profile updated successfully",
      updateError: "Failed to update profile",
      loadError: "Failed to load profile data",
    },
    security: {
      title: "Security",
      password: {
        title: "Password",
        subtitle: "Change your password regularly to keep your account secure",
        changeButton: "Change password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        currentPasswordPlaceholder: "Enter current password",
        newPasswordPlaceholder: "Enter new password",
        confirmPasswordPlaceholder: "Confirm new password",
        dialogTitle: "Change Password",
        dialogDescription:
          "Enter your current password and choose a new secure password",
        submitButton: "Change Password",
        strengthWeak: "Weak password",
        strengthMedium: "Medium password",
        strengthStrong: "Strong password",
        error: "Failed to change password",
        success: "Password changed successfully",
      },
      twoFactor: {
        title: "Two-factor authentication",
        subtitle: "Add an extra layer of security to your account",
        enabled: "Enabled",
        disabled: "Disabled",
        status: "Status",
        enableButton: "Enable 2FA",
        disableButton: "Disable 2FA",
        downloadCodes: "Download codes",
        success: "2FA enabled successfully",
        dialogTitle: "Enable Two-Factor Authentication",
        dialogDescriptionQrcode: "Scan the QR code and verify to enable 2FA",
        dialogDescriptionVerify: "Enter the verification code from your app",
        dialogDescriptionComplete: "Save your backup codes in a safe place",
        qrCodeAlt: "QR Code",
        step1FullTitle: "Step 1: Scan QR Code",
        step1FullDescription:
          "Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code",
        step2FullTitle: "Step 2: Verify Code",
        step2FullDescription:
          "Enter the 6-digit code from your authenticator app",
        step3FullTitle: "Step 3: Backup Codes",
        step3FullDescription:
          "Save these backup codes in a safe place. You will need them if you lose access to your authenticator app.",
        secretKey: "Secret Key:",
        secretKeyHint: "Can't scan? Enter this code manually in your app",
        verificationCode: "Verification Code",
        verificationCodePlaceholder: "000000",
        verifyAndEnable: "Verify & Enable 2FA",
        cancel: "Cancel",
        done: "Done",
        copyAll: "Copy All",
        backupCodesDownloaded: "Backup codes downloaded",
        copied: "Copied to clipboard",
        secretNotFound: "Secret not found. Please generate a new QR code.",
        enableError: "Failed to enable 2FA",
        generateError: "Failed to generate MFA secret",
        disableDialogTitle: "Disable Two-Factor Authentication",
        disableDialogDescription:
          "Enter your password to disable 2FA on your account",
        disableWarning:
          "Your account will be less secure without two-factor authentication. Your backup codes will be invalidated.",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        passwordDescription:
          "Enter your current password to confirm this action",
        disableSuccess: "2FA disabled successfully",
        disableError: "Failed to disable 2FA",
      },
    },
    preferences: {
      title: "Preferences",
      appearance: {
        title: "Appearance",
        subtitle: "Choose how the app is displayed",
        light: "Light",
        dark: "Dark",
        system: "System",
        updated: "Appearance preference updated",
      },
      language: {
        title: "Language",
        subtitle: "Choose your preferred language",
        ptBR: "Portuguese (Brazil)",
        enUS: "English (US)",
        esES: "Spanish",
        updated: "Language preference updated",
      },
    },
    account: {
      title: "Account",
      info: {
        title: "Account information",
        subtitle: "Your account details and statistics",
        accountCreated: "Account created",
        lastLogin: "Last login",
        organizations: "Organizations",
      },
      danger: {
        title: "Danger zone",
        deleteTitle: "Delete account",
        deleteDescription:
          "This action cannot be undone. This will permanently delete your account and all data.",
        deleteButton: "Delete my account",
        confirmMessage:
          "This action cannot be undone. This will permanently delete your account, all your data, and your organization memberships.",
        confirmText: "Type DELETE to confirm",
        confirmCheckbox: "I understand this action is irreversible",
        deleteButtonConfirm: "Delete Account Permanently",
        deleteButtonLoading: "Deleting...",
        confirmTextPlaceholder: "DELETE",
        confirmPasswordPlaceholder: "Enter your current password",
        confirmRequired:
          "Please confirm that you understand this action is irreversible",
        errorGeneric: "Failed to delete account",
        success: "Account deleted successfully",
        ownerWarning:
          "You cannot delete your account while you are an owner of one or more organizations. Please transfer ownership to another member first.",
      },
    },
    auth: {
      signin: {
        title: "Welcome back",
        subtitle: "Please enter your details.",
        email: "Email",
        emailPlaceholder: "Enter your email",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password",
        signInButton: "Sign in",
        signingIn: "Signing in...",
        signInWithGoogle: "Sign in with Google",
        signInWithGitHub: "Sign in with GitHub",
        gitHubError: "GitHub authentication failed. Please try again.",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        invalidCredentials: "Invalid email or password",
        emailNotVerified:
          "Please verify your email before logging in. Check your inbox for a verification link.",
        accountLocked:
          "Account is temporarily locked due to too many failed login attempts. Please try again later.",
        resendVerification: "Resend verification email",
        verificationSent: "Verification email sent! Check your inbox.",
        resendError: "Failed to resend verification email",
        error: "An error occurred. Please try again.",
        googleError: "An error occurred with Google sign in.",
      },
      signup: {
        title: "Create an account",
        subtitle: "Enter your details to get started.",
        name: "Name",
        namePlaceholder: "Enter your name",
        email: "Email",
        emailPlaceholder: "Enter your email",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        confirmPassword: "Confirm password",
        confirmPasswordPlaceholder: "Confirm your password",
        signUpButton: "Sign up",
        signingUp: "Creating account...",
        signUpWithGoogle: "Sign up with Google",
        signUpWithGitHub: "Sign up with GitHub",
        alreadyHaveAccount: "Already have an account?",
        signIn: "Sign in",
        passwordMismatch: "Passwords do not match",
        weakPassword:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
        error: "An error occurred. Please try again.",
        success:
          "Account created successfully! Please check your email to verify your account.",
        inviteMessage:
          "You have been invited to join an organization. Please create your account to accept the invitation.",
      },
      forgotPassword: {
        title: "Forgot password",
        subtitle:
          "Enter your email address and we will send you a link to reset your password.",
        email: "Email",
        emailPlaceholder: "Enter your email",
        sendButton: "Send reset link",
        sending: "Sending...",
        backToSignIn: "Back to sign in",
        success: "Password reset email sent! Check your inbox.",
        error: "An error occurred. Please try again.",
      },
      resetPassword: {
        title: "Reset password",
        subtitle: "Enter your new password below.",
        newPassword: "New password",
        newPasswordPlaceholder: "Enter your new password",
        confirmPassword: "Confirm password",
        confirmPasswordPlaceholder: "Confirm your new password",
        resetButton: "Reset password",
        resetting: "Resetting...",
        passwordMismatch: "Passwords do not match",
        weakPassword:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
        success: "Password reset successfully! Redirecting to sign in...",
        error: "An error occurred. Please try again.",
        invalidToken: "Invalid or expired reset token.",
        backToSignIn: "Back to sign in",
      },
      verifyEmail: {
        title: "Verify your email",
        subtitle: "We have sent a verification link to your email address.",
        checkInbox:
          "Please check your inbox and click on the verification link to activate your account.",
        backToSignIn: "Back to sign in",
        error: "An error occurred. Please try again.",
        verified: "Email verified successfully! Redirecting to sign in...",
        invalidToken: "Invalid or expired verification token.",
      },
      verify2fa: {
        title: "Two-factor authentication",
        subtitleTotp: "Enter the 6-digit code from your authenticator app",
        subtitleEmail: "Enter the 6-digit code sent to {email}",
        code: "Verification code",
        codePlaceholder: "Enter 6-digit code",
        verifyButton: "Verify",
        verifying: "Verifying...",
        resendCode: "Didn't receive a code? Resend",
        codeSent: "Verification code sent successfully",
        invalidCode: "Invalid verification code",
        error: "An error occurred. Please try again.",
      },
      postLogin: {
        preparing: "Preparing your account...",
      },
    },
    footer: {
      privacy: "Privacy",
      terms: "Terms",
    },
    compare: {
      title: "Compare Repositories",
      subtitle: "Side-by-side comparison of repo health and metrics",
      empty: "No repositories with data to compare.",
      ranking: "Repository Ranking",
      columns: {
        repository: "Repository",
        stabilization: "Stabilization",
        revertRate: "Revert Rate",
        churn: "Churn",
        commits: "Commits",
        ai: "AI%",
        trend: "Trend",
        health: "Health",
      },
      mobile: {
        revertRate: "Revert rate",
        trend: "Trend",
      },
    },
    cliAuthorize: {
      metaTitle: "Authorize CLI",
      title: "Authorize CLI",
      subtitle: "Select an organization to connect your terminal.",
      footnote: "This will create an API token for CLI access.",
      noOrgs: "No organizations found. Create one first in the dashboard.",
      authorizeButton: "Authorize",
      done: "Authorized! You can close this tab.",
      doneSubtitle: "Return to your terminal.",
      authorizationFailed: "Authorization failed",
      networkError: "Network error. Please try again.",
      invalidRequest: {
        title: "Invalid Request",
        body: "Missing required parameters. Please run {cmd} again.",
      },
    },
    acceptInvite: {
      invalid: {
        title: "Invalid Invitation",
        description: "This invitation link is invalid or has expired.",
        noToken: "No invitation token found in the URL.",
      },
      processing: {
        title: "Processing Invitation",
        description: "Please wait while we process your invitation...",
      },
      result: {
        successTitle: "Invitation Accepted!",
        successDescription: "You have successfully joined the organization.",
        failedTitle: "Invitation Failed",
        failedDescription: "There was an issue processing your invitation.",
      },
      goToDashboard: "Go to Dashboard",
      goToHomepage: "Go to Homepage",
      signIn: "Sign In",
      fallback: {
        title: "Loading invitation...",
        description:
          "We are preparing your invitation details. Hold on a moment.",
      },
      errors: {
        invalidLink: "Invalid invitation link. No token provided.",
        failedAccept: "Failed to accept invitation",
        unexpected: "An unexpected error occurred",
      },
    },
    notFound: {
      title: "Page Not Found",
      description:
        "Sorry, we couldn't find the page you're looking for. The page might have been removed or the URL might be incorrect.",
      back: "Back to Home",
    },
  },
  "pt-BR": {
    // Portuguese translations will be added later
    // For now, this is just a placeholder structure
    common: {
      cancel: "Cancelar",
      error: "Erro",
      close: "Fechar",
      loading: "Carregando...",
    },
    publicNav: {
      faq: "FAQ",
      deck: "Deck",
      signIn: "Entrar",
      getStarted: "Começar",
      openMenu: "Abrir menu principal",
      githubAria: "GitHub",
    },
    home: {
      hero: {
        badge: "Em acesso antecipado",
        title: "Inteligência de engenharia para a era da IA",
        description:
          "Meça o que sobrevive, não o que é entregue. O Iris analisa seus repositórios Git e revela se a IA está tornando seu código mais durável — ou apenas em maior volume. Detecta Copilot, Claude, Cursor, Windsurf e outras ferramentas de IA automaticamente.",
        ctaPrimary: "Começar",
        ctaSecondary: "Ver um relatório",
        terminalCaption: "delivery-pulse.md",
      },
      problem: {
        title: "O código está realmente melhor — ou só em maior volume?",
        description:
          "Seu time adotou ferramentas de IA. Os commits aumentaram. Os PRs estão mais rápidos. As métricas tradicionais dizem que está tudo ótimo. Mas você não consegue ver o que está quebrando por baixo.",
        oldVelocity: "Velocidade",
        oldThroughput: "Throughput",
        oldCycleTime: "Cycle time",
        newStabilization: "Estabilização",
        newDurability: "Durabilidade",
        newSignalNoise: "Sinal vs ruído",
      },
      provenData: {
        eyebrow: "Validado em dados reais",
        description:
          "Validado em uma organização com 58 repos, 3.497 commits e 1.211 PRs mesclados.",
        stat1Label: "estabilização do código de IA vs código humano",
        stat2Label:
          'dos commits "humanos" batem com padrões de velocidade de IA',
        stat3Label: "de acoplamento detectado em 4 implementações de cliente",
        stat4Label: "rajada explicada pela linha do tempo semanal",
      },
      howItWorks: {
        title: "Como funciona",
        installLabel: "1. Instalar",
        runLabel: "2. Rodar",
        readLabel: "3. Ler",
        readDescription:
          "Receba um relatório em Markdown + métricas em JSON com pulso de entrega, investigação de churn e análise de impacto de IA.",
        prLabel: "Opcional: revisar PRs",
        prDescription:
          "Analise qualquer PR quanto a composição de IA, risco de churn e risco de cascata. Posta os insights como comentário no PR.",
      },
      modules: {
        title: "17 módulos de análise",
        catAI: "Impacto da IA",
        catTemporal: "Inteligência temporal",
        catStructural: "Análise estrutural",
        catInfra: "Infraestrutura",
        items: {
          originClassifier:
            "Atribuição Humano / Assistido por IA / Bot por ferramenta (Copilot, Claude, Cursor, Windsurf)",
          codeDurability:
            "Taxa de sobrevivência de linhas por origem e ferramenta",
          correctionCascades:
            "Padrões de correções em cadeia por origem e ferramenta",
          fixTargeting: "De qual origem o código atrai mais bug fixes",
          acceptanceRate: "Sobrevivência em code review por ferramenta",
          originFunnel: "Commit → PR → Estabilizado → Sobrevivente",
          attributionGap: "Detecção de alta velocidade sem atribuição",
          prInsights: "Análise de PR único com risco de churn e cascata",
          activityTimeline: "Detalhamento semanal com pulso de entrega",
          trendAnalysis: "Comparação entre baseline e período recente",
          patternDetection: "Rajadas, períodos calmos, mudanças de intenção",
          stabilityMap: "Estabilização por diretório",
          churnInvestigation:
            "Detecção de cadeias e acoplamento entre arquivos",
          commitShape: "Perfil estrutural por origem",
          deliveryVelocity: "Correlação entre velocidade e durabilidade",
          primingDetection: "Arquivos de contexto de IA (CLAUDE.md, etc.)",
          attributionHook: "prepare-commit-msg para ferramentas de IA",
        },
      },
      positioning: {
        title: "O que o Iris não é",
        notSurveillanceTitle: "Não é uma ferramenta de vigilância de devs",
        notSurveillanceDesc: "Analisa sistemas, nunca indivíduos",
        notRealtimeTitle: "Não é um painel em tempo real",
        notRealtimeDesc: "Relatórios pontuais, não monitoramento ao vivo",
        notIdeTitle: "Não é um plugin de IDE",
        notIdeDesc: "Funciona apenas a partir do histórico do Git",
        notProductivityTitle: "Não é um rastreador de produtividade",
        notProductivityDesc: "Mede durabilidade, não velocidade",
      },
      cta: {
        title: "Experimente agora",
        description:
          "Um comando. Roda localmente. Plataforma na nuvem é opcional.",
        copy: "Copiar",
        copied: "Copiado!",
        requirements: "Python 3.11+ · Git · Zero dependências",
      },
    },
    faqPage: {
      title: "Perguntas frequentes",
      subtitle:
        "Tudo que você precisa saber sobre o Iris. Não encontrou o que procurava?",
      questions: {
        whatIsTitle: "O que o Iris mede?",
        whatIsAnswer:
          "O Iris analisa seu histórico Git para revelar sinais de qualidade de entrega: estabilização, durabilidade do código, cascatas de correção, lacunas de atribuição e impacto da IA. Os relatórios são pontuais, não monitoramento ao vivo.",
        howWorksTitle: "Como funciona a análise?",
        howWorksAnswer:
          "Rode o CLI em qualquer repo. Ele lê commits, PRs e dados de sobrevivência de código localmente e gera um relatório em Markdown + métricas em JSON. O motor não depende de serviços em nuvem.",
        aiToolsTitle: "Quais ferramentas de IA ele detecta?",
        aiToolsAnswer:
          "Copilot, Claude, Cursor, Windsurf e outras assistentes são detectadas via metadados dos commits, trailers de co-autor e padrões de velocidade. Novas ferramentas podem ser adicionadas via hook prepare-commit-msg.",
        privacyTitle: "O Iris lê meu código?",
        privacyAnswer:
          "O motor roda localmente e só inspeciona metadados Git e diffs. Nada sai da sua máquina, a não ser que você conecte a plataforma na nuvem opcional para agregação entre repos.",
        individualsTitle: "Faz ranking ou score de devs?",
        individualsAnswer:
          "Não. O Iris é explicitamente desenhado para analisar sistemas, nunca indivíduos. Não há ranking de produtividade, leaderboard por autor nem score individual.",
        platformTitle: "O que a plataforma na nuvem agrega?",
        platformAnswer:
          "A plataforma agrega métricas entre repos e ao longo do tempo, oferece dashboards no nível de organização, detecção de mudanças e comparação entre repos. O CLI sozinho é totalmente utilizável sem ela.",
        installTitle: "Como instalo?",
        installAnswer:
          "Rode o script de instalação (curl -fsSL {appUrl}/install.sh | sh) ou pipx install iris. Requer Python 3.11+ e Git.",
        priceTitle: "Quanto custa?",
        priceAnswer:
          "O CLI é gratuito e aberto. A plataforma na nuvem está em acesso antecipado com preço por uso — entre em contato para mais detalhes.",
        contributeTitle: "Como posso contribuir ou reportar problemas?",
        contributeAnswer:
          "O projeto está no GitHub em RocketBus/clickbus-iris. Issues e PRs são bem-vindos.",
      },
    },
    setupLinked: {
      mirroring: "Vai espelhar @{login} do GitHub quando você clicar em criar",
      changeChoice: "Escolher outra org do GitHub",
      unlink: "Criar sem vincular ao GitHub",
    },
    selectGitHubOrg: {
      title: "Escolha a organização do GitHub a acompanhar",
      subtitle:
        "Vamos criar seu workspace Iris espelhando essa org do GitHub. Dá pra adicionar mais depois.",
      loading: "Carregando suas organizações do GitHub...",
      empty:
        "Você não tem organizações do GitHub que o Iris consiga ver. Pode criar um workspace manualmente.",
      manual: "Criar um workspace manualmente",
      noLink:
        "Você não está autenticado com GitHub. Entre com GitHub para usar este fluxo.",
      error:
        "Não conseguimos buscar suas organizações do GitHub. Tente de novo ou caia no setup manual.",
      select: "Continuar",
    },
    welcomeGuide: {
      title: "Primeiros 15 minutos com o Iris",
      subtitle:
        "Uma leitura curta para você saber o que está vendo — e o que não está.",
      whatItMeasures: {
        title: "O que o Iris mede",
        item1:
          "Estabilização — o código que entra realmente persiste, ou é reescrito?",
        item2:
          "Impacto da IA — durabilidade, cascatas e aceitação, separados por IA vs humano.",
        item3:
          "Forma da entrega — mix de intenção, saúde de PRs, hotspots de churn, lacunas de atribuição.",
      },
      whatItIsNot: {
        title: "O que ele não é",
        item1:
          "Não é um rastreador de produtividade — não há ranking ou score individual.",
        item2:
          "Não é monitoramento em tempo real — relatórios são pontuais, não alertas ao vivo.",
        item3:
          "Não é plugin de IDE — o Iris lê o histórico do Git, e nada além disso.",
      },
      steps: {
        title: "Seus três primeiros passos",
        step1Title: "Cadastrar e criar uma organização",
        step1Desc: "Você já passou disso — boa.",
        step2Title: "Conectar um repositório",
        step2Desc:
          "Use o CLI para subir sua primeira análise. A página /connect em qualquer org te guia pelo processo.",
        step3Title: "Ler seu primeiro dashboard",
        step3Desc:
          "Quando os dados chegarem, o dashboard da org mostra saúde, IA vs humano, e as visões abaixo.",
      },
      whereToLook: {
        title: "Onde olhar primeiro",
        intro: "Estas são as visões com maior sinal assim que houver dados:",
        shadowAI:
          "Exposição a IA Sombra — commits que parecem gerados por IA mas não têm atribuição.",
        adoption:
          "Linha do tempo da IA — o que mudou depois que a adoção da IA começou.",
        healthMap:
          "Mapa de saúde — quais repos estão reescrevendo mais do que entregando.",
      },
      footer:
        "Tudo aqui trata sua base de código como o sistema sob estudo, nunca os indivíduos. Veja CLAUDE.md e docs/PRINCIPLES.md se quiser o racional mais profundo.",
      cta: "Entendi, ir para meu dashboard",
      skip: "Pular",
      error: "Não conseguimos salvar sua preferência. Tente novamente.",
    },
    meAiUsage: {
      title: "Seu uso de IA",
      subtitle:
        "Uma autorreflexão tranquila sobre seus próprios padrões de commit. Só você vê esta página.",
      noOrgs:
        "Você ainda não faz parte de nenhuma organização. Entre em uma para ver seus dados aqui.",
      noMatch:
        "Não conseguimos casar seu nome ({name}) com nenhum autor de commit nas suas organizações. Se você comita com outro nome no Git, esta visão vai aparecer assim que sincronizar.",
      privacyNote:
        "Esta página é estritamente pessoal. Não há ranking, comparação com pares e nenhum admin consegue abri-la para outra pessoa.",
      summary: {
        repos: "Repos com sua atividade",
        orgs: "Organizações",
        avgAi: "Média de assistido por IA",
        hvWeeks: "Semanas de alta velocidade",
      },
      trend: {
        title: "Participação assistida por IA ao longo do tempo",
        subtitle: "Média semanal nos repos em que você contribuiu.",
        empty: "Ainda não há dados suficientes para desenhar uma tendência.",
      },
      perRepo: {
        title: "Repos onde você mais usou IA",
        subtitle: "Ordenados pela participação assistida por IA nos commits.",
        repo: "Repositório",
        org: "Organização",
        commits: "Commits",
        aiPct: "% IA",
        hvWeeks: "Semanas AV",
        lastSeen: "Última vez visto",
        nameMatchBadge: "só por nome",
        nameMatchWarning:
          "Atribuído pelo nome do autor, sem email — vale conferir se é você mesmo.",
      },
      coverageNote:
        "Detalhamento por ferramenta e por intenção, no nível de autor, ainda não está no motor. Quando estiver, esta página vai puxar automaticamente.",
    },
    navigation: {
      dashboard: "Dashboard",
      repositories: "Repositórios",
      compare: "Comparar",
      aiExposure: "Exposição a IA",
      team: "Equipe",
      auditLog: "Log de Auditoria",
      profile: "Perfil",
      settings: "Configurações",
      organizationSettings: "Configurações da Organização",
      profileAndSettings: "Perfil e Configurações",
      myAiUsage: "Meu uso de IA",
      signOut: "Sair",
      createOrganization: "Criar Organização",
      organizations: "Organizações",
      openMenu: "Abrir menu de navegação",
    },
    roles: {
      owner: "Proprietário",
      admin: "Administrador",
      member: "Membro",
    },
    dashboard: {
      pulse: {
        totalCommits: "Commits totais",
        prsMerged: "PRs mesclados",
        activeRepos: "Repos ativos",
        contributors: "Contribuidores",
        avgStabilization: "Estabilização média",
        aiAdoption: "Adoção de IA",
      },
      quality: {
        title: "Qualidade da entrega",
        subtitle: "Sinais de qualidade em {count} repositórios",
        distributionTitle: "Distribuição de estabilização",
        distributionSubtitle:
          "Razão de estabilização por repo — dispersão na organização",
        stabTooltip: "Estabilização: {pct}%",
        revertRate: "Taxa de revert",
        cascadeRate: "Taxa de cascata",
        fixLatency: "Latência de correção",
        newCodeChurn: "Churn de código novo (2sem)",
      },
      dora: {
        title: "DORA",
        sourceBadge: "Datadog",
        subtitle:
          "Métricas de deploy da organização nos últimos 30 dias, vindas diretamente do Datadog.",
        metrics: {
          cfr: "Taxa de falha em mudança",
          mttrPerDeploy: "MTTR (por deploy com falha)",
          deployFrequency: "Frequência de deploy",
          leadTime: "Lead Time",
          deploymentsTotal: "Deploys",
          deploymentsTotalHint: "{failed} com falha na janela",
          rollbackRate: "Taxa de rollback",
          rollbackRateHint: "{count} rollbacks entre os deploys com falha",
          pending: "Aguardando avaliação",
          pendingHint: "O Datadog ainda não classificou esses deploys",
        },
        correlation: {
          title: "Taxa de falha por origem do código",
          subtitle:
            "Junção por commit dos deploys do Datadog com a classificação local de origem. Requer ≥ {threshold} deploys com falha para gerar sinal.",
          cfrHeader: "CFR por origem",
          rollbackHeader: "Taxa de rollback por origem",
          cfrDenominator: "({failed} com falha / {evaluated} avaliados)",
          rollbackDenominator: "({rollbacks} de {failed} com falha)",
          insufficient:
            "São necessários pelo menos {threshold} deploys com falha para a comparação IA vs Humano. Atualmente {actual}.",
          origin: {
            HUMAN: "Humano",
            AI_ASSISTED: "Assistido por IA",
            BOT: "Bot",
          },
        },
      },
      aiVsHuman: {
        title: "IA vs Humano",
        subtitle:
          "Como o código assistido por IA se compara em {count} repositórios",
        commitMixTitle: "Mix de commits",
        commitMixSubtitle:
          "Commits humanos vs assistidos por IA ao longo do tempo (organização)",
        human: "Humano",
        ai: "Assistido por IA",
        bot: "Bot",
        qualityComparisonTitle: "Comparação de qualidade",
        qualityComparisonSubtitle: "Agregado em todos os repos com dados de IA",
        stabilization: "Estabilização",
        codeDurability: "Durabilidade do código",
        cascadeRate: "Taxa de cascata",
        toolsTitle: "Ferramentas de IA",
        toolsSubtitle: "Ferramentas detectadas na organização",
        toolsTooltip: "{count} repos",
        toolsDetectedIn: "Detectado em",
        attributionGapTitle: "Lacuna de atribuição",
        attributionGapDescription:
          "{flagged} de {total} commits humanos mostram padrões de IA mas não têm atribuição",
        attributionGapCta: "Ver Exposição a IA Sombra →",
      },
      intent: {
        title: "Distribuição de intenção",
        subtitle:
          "Que tipos de mudanças estão sendo feitas em {count} repositórios",
        commitIntentsTitle: "Intenções de commit",
        commitIntentsSubtitle: "Agregado em todos os repos",
        intentTrendTitle: "Tendência de intenção",
        intentTrendSubtitle: "Mix semanal de intenções ao longo do tempo",
        featureToFix: "Razão Feature/Fix",
        buildingMore: "Construindo mais do que corrigindo",
        fixingMore: "Corrigindo mais do que construindo",
        labels: {
          feature: "Feature",
          fix: "Fix",
          refactor: "Refactor",
          config: "Config",
          unknown: "Desconhecido",
        },
      },
      prHealth: {
        title: "Saúde de PRs",
        subtitle: "Métricas de pull request em {count} repositórios",
        prsMerged: "PRs mesclados",
        timeToMerge: "Tempo até merge",
        singlePassRate: "Taxa de aprovação direta",
        reviewRounds: "Rodadas de revisão",
        byOriginTitle: "Aceitação de PR por origem",
        byOriginSubtitle: "Como PRs assistidos por IA se comparam aos humanos",
        origin: "Origem",
        human: "Humano",
        ai: "Assistido por IA",
      },
      cycleTime: {
        title: "Cycle Time",
        subtitle:
          "Quanto tempo a engenharia leva para entregar, do PR aberto ao merge.",
        insight:
          "A engenharia entrega rápido. {pct} dos PRs são mesclados em até 1 dia. A mediana do cycle time é {median}. Os gargalos de lead time estão antes (definição de demanda/produto) e depois (infra, ambientes, deploy) — não na execução do código.",
        kpi: {
          pctWithin24h: "PRs merged em até 1 dia",
          median: "Mediana do cycle time",
          mean: "Média do cycle time",
          p90: "P90 do cycle time",
        },
        charts: {
          ranking: {
            title: "% PRs Merged em até 1 Dia — por Repo",
            subtitle: "Quanto maior, mais rápido o repositório entrega",
          },
          distribution: {
            title: "Distribuição de Cycle Time — por Repo",
            subtitle: "Empilhado: quanto mais verde/ciano, mais rápido",
          },
        },
        buckets: {
          sameDay: "Mesmo dia",
          oneDay: "1 dia",
          twoThree: "2–3 dias",
          fourSeven: "4–7 dias",
          sevenPlus: "7+ dias",
        },
        tooltips: {
          ranking: "{merged} PRs mesclados",
        },
      },
      healthMap: {
        title: "Mapa de saúde",
        subtitle:
          "Tamanho do repositório por commits, colorido por estabilização",
        tooltip: "{pct}% estab · {commits} commits",
        improving: "Melhorando",
        worsening: "Piorando",
        noChanges: "Nenhuma mudança significativa detectada",
      },
      orgTimeline: {
        title: "Linha do tempo da organização",
        subtitle: "Atividade semanal em todos os repositórios",
        commits: "Commits",
        stabilization: "Estabilização",
        aiAdoption: "Adoção de IA",
      },
      hyperEngineers: {
        title: "Hyper Engineers",
        subtitle:
          "Contribuidores com alta velocidade ou 80%+ de adoção de IA na organização",
        badge: "Hyper Engineer",
        repos: "{count} repos",
      },
      repoList: {
        empty: "Nenhum repositório ainda.",
        searchPlaceholder: "Buscar repositórios...",
      },
    },
    investHere: {
      title: "Onde investir",
      subtitle:
        "Padrões sistêmicos que geram mais retrabalho neste repositório.",
      empty:
        "Nenhum hotspot sistêmico detectado. Estabilização, acoplamento e distribuição de fixes estão dentro de faixas saudáveis.",
      severityHigh: "Alto",
      severityMedium: "Médio",
      severityLow: "Baixo",
      weakDirectoryTitle: "Diretório frágil: {directory}",
      weakDirectoryReason:
        "Código aqui estabiliza em {ratio}% nos {files} arquivos tocados. O diretório absorveu {churn} eventos de churn — retrabalho se concentra aqui.",
      tightCouplingTitle: "Acoplamento alto",
      tightCouplingReason:
        "{fileA} e {fileB} mudam juntos {rate}% das vezes ({count} mudanças conjuntas). Desacoplar reduziria o custo de retrabalho na área.",
      fixMagnetTitle: "{origin} atrai fixes",
      fixMagnetReason:
        "Commits de {origin} representam {codeShare}% das mudanças mas {fixShare}% dos fixes ({disp}× o baseline, {count} fixes na janela). Os padrões de review podem precisar de ajuste para essa origem.",
      hypothesisNote:
        "Estes são hipóteses sistêmicas derivadas do histórico de commits. Indicam onde a atenção pode reduzir retrabalho, não quem é responsável.",
    },
    adoption: {
      title: "Timeline de Entrega com IA",
      subtitle:
        "O que mudou neste repositório depois que os commits assistidos por IA começaram.",
      orgTitle: "Timeline de Entrega com IA",
      orgSubtitle:
        "Repositórios onde a adoção de IA foi detectada e como a qualidade de entrega se alterou desde então.",
      orgEmpty:
        "Nenhum evento de adoção de IA detectado ainda nesta organização.",
      empty:
        "Nenhum evento de adoção de IA detectado. Instale o hook do Iris ou faça commits com atribuição de IA para essa visão aparecer.",
      insufficient:
        "Coletando dados: {count} commits com IA até agora (precisa de pelo menos 5 para analisar deltas pré/pós).",
      detected: "Adoção de IA detectada em {date} ({count} commits com IA)",
      hypothesisNote:
        "Os deltas comparam janelas pré-adoção e pós-adoção. Correlação, não causalidade — outras mudanças podem ter acontecido em paralelo.",
      confidence: {
        clear: "Claro",
        sparse: "Esparso",
        insufficient: "Insuficiente",
      },
      columns: {
        metric: "Métrica",
        pre: "Pré-adoção",
        post: "Pós-adoção",
        delta: "Delta",
        repository: "Repositório",
        detected: "Detectado em",
        stabilizationDelta: "Δ Estabilização",
        aiCommits: "Commits IA",
      },
      metrics: {
        stabilization: "Taxa de estabilização",
        durability: "Durabilidade (linhas sobreviventes)",
        cascade: "Taxa de cascata",
        revert: "Taxa de revert",
        newCodeChurn: "Churn de código novo (4s)",
      },
    },
    toolComparison: {
      title: "Comparação de Ferramentas de IA",
      subtitle:
        "Sinais de qualidade lado a lado entre as ferramentas de IA usadas no seu código.",
      columnTool: "Ferramenta",
      columnCommits: "Commits",
      columnDurability: "Durabilidade",
      columnCascade: "Cascata",
      columnRevert: "Revert",
      columnSinglePass: "PR one-shot",
      belowThreshold: "abaixo do threshold",
      thresholdNote:
        "Linhas com menos de {threshold} commits ficam marcadas como baixa confiança e vão pro final da lista.",
      noSignificant:
        "Nenhuma ferramenta ainda tem commits suficientes para uma comparação significativa (mínimo {threshold}).",
    },
    connect: {
      title: "Conecte seu primeiro repositório",
      subtitle:
        "Tenha seu primeiro insight em menos de 5 minutos. Três comandos curtos no terminal.",
      alreadyConnected:
        "Você já tem {count} {repoLabel} conectado. Você ainda pode adicionar mais pela CLI.",
      repoSingular: "repositório",
      repoPlural: "repositórios",
      goToDashboard: "Ir para o dashboard",
      emptyStateLink: "Conecte seu primeiro repositório",
      step1Label: "Instale a CLI",
      step1Hint: "macOS, Linux ou WSL",
      step1Alt: "Usa pipx? Rode",
      step2Label: "Faça login pelo terminal",
      step2Hint: "Abre uma aba do navegador para autorizar esta organização.",
      step3Label: "Analise um repositório",
      step3Hint: "Aponte a CLI para qualquer repositório Git local.",
      waiting: "Aguardando o primeiro ingest…",
      waitingHint: "Verificamos a cada 5 segundos. Mantenha esta aba aberta.",
      detected: "Primeiro sinal capturado — redirecionando…",
      copy: "Copiar",
      copied: "Copiado",
    },
    repos: {
      title: "Repositórios",
      subtitle: "{count} repositórios em {org}",
      deleteButton: "Excluir repositório",
      deleteDialog: {
        title: "Excluir Repositório",
        description:
          "Isso excluirá permanentemente o repositório {name} e todas as suas execuções de análise e métricas. Esta ação não pode ser desfeita.",
        warning:
          "Excluir um repositório é irreversível. Todo o histórico de execuções, métricas e insights deste repositório serão removidos permanentemente.",
        confirmLabel: "Digite {name} para confirmar",
        confirmButton: "Excluir Repositório Permanentemente",
        success: "Repositório excluído com sucesso",
        error: "Falha ao excluir repositório",
        mismatch:
          "O texto de confirmação deve corresponder ao nome do repositório",
      },
      detail: {
        metrics: {
          stabilization: "Estabilização",
          revertRate: "Taxa de revert",
          churnEvents: "Eventos de churn",
          commits: "Commits",
        },
        dora: {
          title: "DORA",
          subtitle:
            "Métricas de deploy deste repositório nos últimos {days} dias.",
          incidentDisclaimer:
            "MTTR por incidente não aparece per-repo — os eventos de falha do Datadog não carregam atribuição de repositório, então qualquer número per-repo seria uma cópia enganosa do org-wide. Veja a visão de incidentes no dashboard.",
        },
        activeContributors: "Contribuidores ativos",
        contributorsCount: "{count} contribuidor na última janela de análise",
        contributorsCountPlural:
          "{count} contribuidores na última janela de análise",
        runHistory: "Histórico de execuções",
        runColumns: {
          date: "Data",
          commits: "Commits",
          window: "Janela",
          cli: "CLI",
        },
      },
    },
    repoCharts: {
      stabilization: {
        title: "Razão de estabilização",
        subtitle: "Porcentagem de arquivos que persistem sem rework",
        label: "Estabilização",
      },
      intent: {
        title: "Distribuição de intenção",
        subtitle: "Que tipos de mudanças estão sendo feitas",
        labels: {
          feature: "Feature",
          fix: "Fix",
          refactor: "Refactor",
          config: "Config",
          unknown: "Desconhecido",
        },
      },
      origin: {
        title: "Distribuição de origem",
        subtitle: "Commits humanos vs assistidos por IA",
        stabByOrigin: "Estabilização por origem",
        labels: {
          human: "Humano",
          ai: "Assistido por IA",
          bot: "Bot",
        },
      },
      churn: {
        title: "Eventos de churn",
        subtitle: "Arquivos modificados repetidamente em janelas curtas",
        label: "Churn",
      },
      aiAdoption: {
        title: "Adoção de IA",
        subtitle: "Cobertura de commits assistidos por IA ao longo do tempo",
        label: "Cobertura de IA",
      },
      commits: {
        title: "Commits",
        subtitle: "Total de commits por execução de análise",
        label: "Commits",
      },
      cascades: {
        title: "Cascatas de correção",
        subtitle: "Commits que disparam correções de acompanhamento",
        rate: "Taxa de cascata",
        medianDepth: "Profundidade mediana",
        depthFixes: "{value} fixes",
        byOrigin: "{pct}% ({cascades}/{total})",
      },
      durability: {
        title: "Durabilidade do código",
        subtitle: "Taxa de sobrevivência de linhas no HEAD",
        survival: "{pct}% sobrevivência",
        introduced: "{count} introduzidas",
        surviving: "{count} sobrevivendo",
        medianAge: "{days}d idade mediana",
      },
      weeklyActivity: {
        title: "Atividade semanal",
        subtitle: "Detalhamento por semana da última análise",
        columns: {
          week: "Semana",
          commits: "Commits",
          loc: "LOC",
          feature: "Feature",
          fix: "Fix",
          aiPct: "IA%",
        },
      },
      flowLoad: {
        title: "Flow Load",
        subtitle:
          "WIP por semana ISO — PRs em paralelo agrupados por intent, com o número de autores distintos por semana (paralelismo de engenharia apenas; backlog, design e branches locais não aparecem).",
        wipAxis: "PRs em paralelo",
        authorsAxis: "Autores / semana",
        authorsLine: "Autores distintos",
        intentLabels: {
          FEATURE: "Feature",
          FIX: "Fix",
          REFACTOR: "Refactor",
          CONFIG: "Config",
          UNKNOWN: "Desconhecido",
        },
      },
      flowEfficiency: {
        title: "Flow Efficiency",
        subtitle:
          "Tempo ativo vs em espera no ciclo de vida dos PRs merged. Throughput diz quanto foi entregue; isso diz se o trabalho fluiu ou ficou em fila.",
        efficiencyLabel: "Fração ativa",
        ttfrLabel: "Tempo até o primeiro review",
        ttfrUnit: "h",
        phaseLabels: {
          coding: "Coding",
          awaiting_first_review: "Aguardando primeiro review",
          in_review_active: "Em review · ativo",
          in_review_wait: "Em review · espera",
          awaiting_merge: "Aguardando merge",
        },
        byIntentTitle: "Por intent",
      },
      aiImpact: {
        title: "Impacto da IA",
        subtitle:
          "Como o código assistido por IA se compara ao humano ao longo do tempo",
      },
      commitMix: {
        title: "Mix de commits",
        subtitle: "Commits humanos vs assistidos por IA ao longo do tempo",
        human: "Humano",
        ai: "Assistido por IA",
      },
      compare: {
        stabilizationTitle: "Estabilização",
        stabilizationSubtitle:
          "Taxa de persistência de arquivos — Humano vs IA",
        durabilityTitle: "Durabilidade do código",
        durabilitySubtitle:
          "Taxa de sobrevivência de linhas no HEAD — Humano vs IA",
        cascadesTitle: "Cascatas de correção",
        cascadesSubtitle:
          "Taxa de gatilho de cascata de correção — Humano vs IA",
      },
    },
    aiExposure: {
      title: "Exposição a Shadow AI",
      subtitle:
        "Quanto código assistido por IA está sendo produzido — e quanto está atribuído.",
      empty:
        "Ainda não há dados de origem. Rode a CLI em um repositório para começar a medir.",
      summary: {
        attributed: "IA Atribuída",
        attributedHint:
          "Commits com rastro de co-autor IA (ex: Copilot, Claude, Cursor)",
        estimated: "IA Estimada",
        estimatedHint:
          "Limite superior: commits atribuídos mais commits humanos com padrão de IA",
        gap: "Gap de Shadow AI",
        gapHint:
          "Pontos percentuais entre estimado e atribuído. Maior = mais provável IA oculta.",
        baseline:
          "{flagged} de {total} commits humanos batem com ≥2 sinais de IA (rajada, diff grande, sucessão rápida, dispersão ampla).",
        noSignal:
          "Nenhum sinal de shadow detectado entre os repositórios. A cobertura atribuída reflete o uso real de IA no histórico.",
      },
      table: {
        title: "Repositórios ordenados por gap",
        name: "Repositório",
        attributed: "Atribuído",
        shadow: "Sinal shadow",
        gap: "Gap",
        action: "",
        installHook: "Instalar hook",
        attributedOnly: "atribuído",
        noSignal: "sem sinal",
      },
      install: {
        title: "Feche o gap de atribuição",
        description:
          "Instale o hook prepare-commit-msg do Iris em {name} para que commits de IA passem a ter atribuição automática.",
        step1: "Faça login pela CLI",
        step2: "Instale o hook no repositório",
        step3: "Os próximos commits de IA serão atribuídos automaticamente",
        copy: "Copiar",
        copied: "Copiado",
        done: "Entendi",
      },
      hypothesisNote:
        "Estes números são hipóteses, não verdades. O sinal de shadow marca commits que batem com padrões vistos em trabalho com IA; não prova autoria por IA.",
    },
    team: {
      title: "Equipe",
      subtitle: "Gerencie os membros da sua equipe e seus papéis",
      memberActionsAriaLabel: "Ações do membro",
      members: "Membros",
      pendingInvitations: "Convites Pendentes",
      noMembers: "Ainda não há membros na equipe.",
      inviteFirstMember: "Convide seu primeiro membro da equipe para começar.",
      inviteMember: "Convidar Membro",
      joinedAt: "Ingressou em",
      removeMember: "Remover Membro",
      transferOwnership: "Transferir Propriedade",
      inviteDialog: {
        title: "Convidar Membro da Equipe",
        description: "Envie um convite para participar da sua organização",
        emailLabel: "Endereço de e-mail",
        emailPlaceholder: "usuario@exemplo.com",
        roleLabel: "Papel",
        inviteButton: "Enviar Convite",
        success: "Convite enviado com sucesso",
        error: "Falha ao enviar convite",
      },
      removeDialog: {
        title: "Remover Membro da Equipe",
        description:
          "Tem certeza de que deseja remover {name} desta organização? Esta ação não pode ser desfeita e eles perderão acesso à organização.",
        confirmButton: "Remover Membro",
        success: "Membro removido com sucesso",
        error: "Falha ao remover membro",
      },
      changeRoleDialog: {
        changeButton: "Promover para",
        demoteButton: "Rebaixar para",
        success: "Papel alterado com sucesso",
        error: "Falha ao alterar papel",
      },
      transferOwnershipDialog: {
        title: "Transferir Propriedade da Organização",
        description:
          "Tem certeza de que deseja transferir a propriedade desta organização para {name} ({email})? Você se tornará um Administrador após esta ação. Isso não pode ser desfeito.",
        warning:
          "Transferir a propriedade é uma ação crítica. Você perderá os privilégios de proprietário e se tornará um Administrador.",
        newOwnerLabel: "Novo Proprietário",
        transferButton: "Transferir Propriedade",
        success: "Propriedade transferida com sucesso",
        error: "Falha ao transferir propriedade",
      },
      invitationCard: {
        invitedBy: "Convidado por",
        expiresIn: "Expira em {days} dias",
        expired: "Expirado",
        cancelButton: "Cancelar Convite",
        resendButton: "Reenviar Convite",
        cancelSuccess: "Convite cancelado",
        resendSuccess: "Convite reenviado",
        cancelDialog: {
          title: "Cancelar Convite",
          description:
            "Tem certeza de que deseja cancelar o convite para {email}? Eles não poderão mais usar este link de convite para participar da organização.",
          confirmButton: "Cancelar Convite",
        },
      },
      memberLabel: "membro",
      membersLabel: "membros",
      invitationLabel: "convite",
      invitationsLabel: "convites",
    },
    settings: {
      title: "Configurações da Organização",
      subtitle: "Gerencie as configurações e preferências da sua organização",
      integrations: {
        title: "Integrações",
        subtitle:
          "Conecte sistemas externos para trazer dados de deploy e incidentes para a análise.",
        footnote:
          "Em breve. Novos providers aparecerão aqui conforme forem implementados.",
        status: {
          notConnected: "Não conectada",
          connected: "Conectada",
          error: "Erro",
          disconnected: "Desconectada",
        },
        providers: {
          datadog: {
            name: "Datadog",
            description:
              "Puxe deployments e incidentes da DORA Metrics API do Datadog.",
            detail:
              "Conectado, o Iris vai sincronizar eventos de deploy e falha diariamente e usá-los para calcular Change Failure Rate e MTTR reais junto com os estimados derivados do git.",
          },
        },
        detail: {
          backLink: "Voltar para integrações",
          comingSoonTitle: "Em breve",
          comingSoonDescription:
            "Fluxo de conexão, credenciais e configuração de sincronização chegam nas próximas releases.",
        },
        datadog: {
          connectTitle: "Conectar Datadog",
          connectDescription:
            "Forneça uma API Key e uma Application Key do Datadog com o escopo dora_metrics_read. Validamos junto ao seu tenant antes de salvar.",
          connectButton: "Conectar Datadog",
          connectSuccess: "Datadog conectado com sucesso.",
          connectError: "Falha ao conectar o Datadog.",
          errorTitle: "A sincronização do Datadog está falhando",
          errorDescription:
            "O Iris segue conectado, mas a sincronização mais recente deu erro. Confira a mensagem abaixo; assim que o Datadog voltar a aceitar as credenciais, o próximo cron retoma a ingestão.",
          connectedTitle: "Datadog está conectado",
          connectedDescription:
            "O Iris usa essas credenciais para sincronizar deploys e incidentes diariamente.",
          disconnectButton: "Desconectar",
          disconnectSuccess:
            "Datadog desconectado. Os dados históricos foram preservados.",
          disconnectError: "Falha ao desconectar o Datadog.",
          fields: {
            apiKey: "API Key",
            appKey: "Application Key",
            appKeyHint:
              "A Application Key carrega as permissões do usuário. Crie uma com escopo dora_metrics_read em Application Keys nas configurações do Datadog.",
            site: "Site do Datadog",
            lastSyncAt: "Última sincronização",
            connectedAt: "Conectada em",
            neverSynced: "Ainda não sincronizada",
            unmatchedDeployments: "Deploys não vinculados",
            unmatchedDeploymentsHint:
              "Deploys cujo slug de repositório do Datadog não correspondeu a um repositório rastreado pelo Iris. Verifique se a URL remota do repositório no Iris bate com o repository_id do Datadog.",
            lastIncidentRegistered: "Último incidente registrado",
            lastIncidentNever: "Nenhum incidente registrado ainda",
            lastIncidentHint:
              "O incidente mais recente foi ingerido há {days} dia(s). Se esse número continuar crescendo, verifique se o feed de falhas DORA do Datadog ainda está ativo.",
            lastIncidentNeverHint:
              "O Datadog ainda não enviou nenhum evento de falha para esta org. A métrica MTTR por incidente fica vazia até o primeiro chegar.",
          },
          disconnectDialog: {
            title: "Desconectar o Datadog?",
            description:
              "As credenciais serão removidas e a sincronização diária será interrompida. Os deploys e incidentes já ingeridos permanecem no Iris. Você pode reconectar a qualquer momento.",
            cancel: "Cancelar",
            confirm: "Sim, desconectar",
          },
        },
      },
      dangerZone: "Zona de Perigo",
      deleteOrganizationDescription:
        "Ações irreversíveis e destrutivas para esta organização",
      deleteOrganizationWarning:
        "Depois de excluir uma organização, não há como voltar atrás. Por favor, tenha certeza.",
      deleteOrganizationButton: "Excluir Organização",
      deleteOrganizationDialog: {
        title: "Excluir Organização",
        description:
          "Esta ação não pode ser desfeita. Isso excluirá permanentemente a organização {name} e todos os seus dados associados.",
        warning:
          "Excluir uma organização é irreversível. Todos os dados, membros e configurações serão permanentemente removidos.",
        confirmLabel: "Digite {name} para confirmar",
        confirmButton: "Excluir Organização Permanentemente",
        success: "Organização excluída com sucesso",
        error: "Falha ao excluir organização",
      },
      logoUpload: {
        title: "Logotipo da Organização",
        description:
          "Envie um logotipo personalizado para {name}. Ele aparecerá no canto superior esquerdo de todas as páginas.",
        currentLogo: "Logotipo Atual",
        customLogo: "Logotipo personalizado",
        defaultLogo: "Usando logotipo padrão",
        changeLogo: "Alterar Logotipo",
        uploadLogo: "Enviar Logotipo",
        uploading: "Enviando...",
        success: "Logotipo enviado com sucesso",
        error: "Falha ao enviar logotipo",
        recommendedSize:
          "Recomendado: Imagem quadrada, máx. 5MB. Formatos suportados: JPEG, PNG, GIF, WebP, SVG",
      },
      renameOrganization: {
        title: "Nome da Organização",
        description:
          "Altere o nome de exibição da sua organização. O slug não pode ser alterado para evitar conflitos.",
        nameLabel: "Nome da Organização",
        namePlaceholder: "Digite o nome da organização",
        nameHint: "O nome de exibição mostrado em toda a aplicação",
        slugLabel: "Slug da Organização",
        slugHint:
          "O slug não pode ser alterado pois é usado nas URLs. Isso ajuda a evitar conflitos.",
        saveButton: "Salvar Alterações",
        saving: "Salvando...",
        success: "Nome da organização atualizado com sucesso",
        error: "Falha ao atualizar nome da organização",
        nameRequired: "O nome da organização é obrigatório",
        noChanges: "Nenhuma alteração para salvar",
      },
      autoAcceptDomain: {
        title: "Entrada Automática por Domínio",
        description:
          "Permite que pessoas com o mesmo domínio de e-mail verificado dos proprietários da organização entrem automaticamente.",
        toggleLabel:
          "Aceitar automaticamente membros com o domínio do proprietário",
        enabledDescription:
          "Usuários com endereços de e-mail que terminam em {domain} são adicionados automaticamente como membros.",
        disabledDescription:
          "Novos membros precisam ser convidados manualmente antes de entrar.",
        enabledToast:
          "E-mails com domínio {domain} agora entram automaticamente como membros.",
        disabledToast: "Entrada automática por domínio desativada.",
        error: "Não foi possível atualizar essa configuração.",
        domainLabel: "Domínio aprovado: {domain}",
        domainUnavailable: "Domínio indisponível",
        denylistNotice:
          "Domínios pessoais (gmail, hotmail, etc.) são bloqueados automaticamente.",
      },
    },
    setup: {
      title: "Crie Sua Organização",
      description: "Comece criando sua primeira organização",
      organizationName: "Nome da Organização",
      organizationNamePlaceholder: "Minha Empresa",
      organizationSlug: "Slug da Organização",
      organizationSlugPlaceholder: "minha-empresa",
      organizationSlugDescription: "Isso será usado na URL da sua organização",
      createButton: "Criar Organização",
      creating: "Criando...",
      nameRequired: "O nome da organização é obrigatório",
      slugInvalid:
        "O slug da organização deve ter entre 3 e 50 caracteres e conter apenas letras, números e hífens",
      error: "Falha ao criar organização",
      errorGithubOrgTaken:
        "Esta organização do GitHub já está vinculada a um workspace Iris do qual você não é membro. Peça a um membro existente para te convidar.",
    },
    auditLog: {
      title: "Log de Auditoria",
      subtitle:
        "Acompanhe alterações e ações sensíveis realizadas na sua organização.",
      emptyState: "Nenhum registro de auditoria disponível ainda.",
      systemActor: "Sistema",
      noTarget: "Sem alvo",
      noMetadata: "Nenhum metadado registrado",
      viewMetadata: "Ver metadados",
      ipAddressLabel: "IP",
      userAgentLabel: "User agent",
      columns: {
        timestamp: "Data/Hora",
        actor: "Autor",
        action: "Ação",
        target: "Alvo",
        metadata: "Metadados",
        context: "Contexto",
      },
    },
    profile: {
      pageTitle: "Configurações",
      pageSubtitle: "Gerencie as configurações e preferências da sua conta",
      title: "Perfil",
      subtitle: "Atualize suas informações pessoais",
      email: "E-mail",
      verified: "Verificado",
      save: "Salvar",
      cancel: "Cancelar",
      edit: "Editar",
      fullName: "Nome Completo",
      profileInformation: "Informações do Perfil",
      changeAvatar: "Alterar avatar",
      uploadAvatar: "Enviar Avatar",
      removeAvatar: "Remover",
      avatarStatus: {
        custom: "Usando avatar personalizado",
        gravatar: "Usando Gravatar",
        none: "Envie um avatar ou configure um no Gravatar.com",
      },
      avatarUpload: {
        recommendedSize:
          "Recomendado: Imagem quadrada, máx. 5MB. Formatos suportados: JPEG, PNG, GIF, WebP, SVG",
        uploading: "Enviando...",
        success: "Avatar enviado com sucesso",
        error: "Falha ao enviar avatar",
        removeSuccess: "Avatar removido com sucesso",
        removeError: "Falha ao remover avatar",
      },
      updateSuccess: "Perfil atualizado com sucesso",
      updateError: "Falha ao atualizar perfil",
      loadError: "Falha ao carregar dados do perfil",
    },
    security: {
      title: "Segurança",
      password: {
        title: "Senha",
        subtitle: "Altere sua senha regularmente para manter sua conta segura",
        changeButton: "Alterar senha",
        currentPassword: "Senha atual",
        newPassword: "Nova senha",
        confirmPassword: "Confirmar nova senha",
        currentPasswordPlaceholder: "Digite a senha atual",
        newPasswordPlaceholder: "Digite a nova senha",
        confirmPasswordPlaceholder: "Confirme a nova senha",
        dialogTitle: "Alterar senha",
        dialogDescription:
          "Digite sua senha atual e escolha uma nova senha segura",
        submitButton: "Alterar senha",
        strengthWeak: "Senha fraca",
        strengthMedium: "Senha média",
        strengthStrong: "Senha forte",
        error: "Falha ao alterar a senha",
        success: "Senha alterada com sucesso",
      },
      twoFactor: {
        title: "Autenticação de dois fatores",
        subtitle: "Adicione uma camada extra de segurança à sua conta",
        enabled: "Ativado",
        disabled: "Desativado",
        status: "Status",
        enableButton: "Ativar 2FA",
        disableButton: "Desativar 2FA",
        downloadCodes: "Baixar códigos",
        success: "2FA ativado com sucesso",
        dialogTitle: "Ativar Autenticação de Dois Fatores",
        dialogDescriptionQrcode:
          "Escaneie o código QR e verifique para ativar o 2FA",
        dialogDescriptionVerify:
          "Digite o código de verificação do seu aplicativo",
        dialogDescriptionComplete:
          "Salve seus códigos de backup em um local seguro",
        qrCodeAlt: "QR Code",
        step1FullTitle: "Passo 1: Escanear Código QR",
        step1FullDescription:
          "Use seu aplicativo autenticador (Google Authenticator, Authy, etc.) para escanear este código QR",
        step2FullTitle: "Passo 2: Verificar Código",
        step2FullDescription:
          "Digite o código de 6 dígitos do seu aplicativo autenticador",
        step3FullTitle: "Passo 3: Códigos de Backup",
        step3FullDescription:
          "Salve estes códigos de backup em um local seguro. Você precisará deles se perder acesso ao seu aplicativo autenticador.",
        secretKey: "Chave Secreta:",
        secretKeyHint:
          "Não consegue escanear? Digite este código manualmente no seu aplicativo",
        verificationCode: "Código de Verificação",
        verificationCodePlaceholder: "000000",
        verifyAndEnable: "Verificar e Ativar 2FA",
        cancel: "Cancelar",
        done: "Concluído",
        copyAll: "Copiar Tudo",
        backupCodesDownloaded: "Códigos de backup baixados",
        copied: "Copiado para a área de transferência",
        secretNotFound:
          "Chave secreta não encontrada. Por favor, gere um novo código QR.",
        enableError: "Falha ao ativar 2FA",
        generateError: "Falha ao gerar chave secreta MFA",
        disableDialogTitle: "Desativar Autenticação de Dois Fatores",
        disableDialogDescription:
          "Digite sua senha para desativar o 2FA na sua conta",
        disableWarning:
          "Sua conta ficará menos segura sem autenticação de dois fatores. Seus códigos de backup serão invalidados.",
        passwordLabel: "Senha",
        passwordPlaceholder: "Digite sua senha",
        passwordDescription: "Digite sua senha atual para confirmar esta ação",
        disableSuccess: "2FA desativado com sucesso",
        disableError: "Falha ao desativar 2FA",
      },
    },
    preferences: {
      title: "Preferências",
      appearance: {
        title: "Aparência",
        subtitle: "Escolha como o aplicativo é exibido",
        light: "Claro",
        dark: "Escuro",
        system: "Sistema",
        updated: "Preferência de aparência atualizada",
      },
      language: {
        title: "Idioma",
        subtitle: "Escolha seu idioma preferido",
        ptBR: "Português (Brasil)",
        enUS: "English (US)",
        esES: "Espanhol",
        updated: "Preferência de idioma atualizada",
      },
    },
    account: {
      title: "Conta",
      info: {
        title: "Informações da conta",
        subtitle: "Detalhes e estatísticas da sua conta",
        accountCreated: "Conta criada em",
        lastLogin: "Último acesso",
        organizations: "Organizações",
      },
      danger: {
        title: "Zona de perigo",
        deleteTitle: "Excluir conta",
        deleteDescription:
          "Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e todos os seus dados.",
        deleteButton: "Excluir minha conta",
        confirmMessage:
          "Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta, todos os seus dados e suas associações a organizações.",
        confirmText: "Digite DELETE para confirmar",
        confirmCheckbox: "Eu entendo que esta ação é irreversível",
        deleteButtonConfirm: "Excluir conta permanentemente",
        deleteButtonLoading: "Excluindo...",
        confirmTextPlaceholder: "DELETE",
        confirmPasswordPlaceholder: "Digite sua senha atual",
        confirmRequired:
          "Confirme que você entende que esta ação é irreversível",
        errorGeneric: "Falha ao excluir a conta",
        success: "Conta excluída com sucesso",
        ownerWarning:
          "Você não pode excluir sua conta enquanto for proprietário de uma ou mais organizações. Transfira a propriedade para outro membro primeiro.",
      },
    },
    auth: {
      signin: {
        title: "Bem-vindo de volta",
        subtitle: "Por favor, insira seus dados.",
        email: "E-mail",
        emailPlaceholder: "Digite seu e-mail",
        password: "Senha",
        passwordPlaceholder: "Digite sua senha",
        rememberMe: "Lembrar-me",
        forgotPassword: "Esqueceu a senha",
        signInButton: "Entrar",
        signingIn: "Entrando...",
        signInWithGoogle: "Entrar com Google",
        signInWithGitHub: "Entrar com GitHub",
        gitHubError: "Falha na autenticação com o GitHub. Tente novamente.",
        noAccount: "Não tem uma conta?",
        signUp: "Cadastrar-se",
        invalidCredentials: "E-mail ou senha inválidos",
        emailNotVerified:
          "Por favor, verifique seu e-mail antes de fazer login. Verifique sua caixa de entrada para um link de verificação.",
        accountLocked:
          "Conta temporariamente bloqueada devido a muitas tentativas de login falhadas. Por favor, tente novamente mais tarde.",
        resendVerification: "Reenviar e-mail de verificação",
        verificationSent:
          "E-mail de verificação enviado! Verifique sua caixa de entrada.",
        resendError: "Falha ao reenviar e-mail de verificação",
        error: "Ocorreu um erro. Por favor, tente novamente.",
        googleError: "Ocorreu um erro com o login do Google.",
      },
      signup: {
        title: "Criar uma conta",
        subtitle: "Digite seus dados para começar.",
        name: "Nome",
        namePlaceholder: "Digite seu nome",
        email: "E-mail",
        emailPlaceholder: "Digite seu e-mail",
        password: "Senha",
        passwordPlaceholder: "Digite sua senha",
        confirmPassword: "Confirmar senha",
        confirmPasswordPlaceholder: "Confirme sua senha",
        signUpButton: "Cadastrar-se",
        signingUp: "Criando conta...",
        signUpWithGoogle: "Cadastrar-se com Google",
        signUpWithGitHub: "Cadastrar-se com GitHub",
        alreadyHaveAccount: "Já tem uma conta?",
        signIn: "Entrar",
        passwordMismatch: "As senhas não coincidem",
        weakPassword:
          "A senha deve ter pelo menos 8 caracteres e conter pelo menos uma letra maiúscula, uma letra minúscula e um número",
        error: "Ocorreu um erro. Por favor, tente novamente.",
        success:
          "Conta criada com sucesso! Por favor, verifique seu e-mail para ativar sua conta.",
        inviteMessage:
          "Você foi convidado para se juntar a uma organização. Por favor, crie sua conta para aceitar o convite.",
      },
      forgotPassword: {
        title: "Esqueceu a senha",
        subtitle:
          "Digite seu endereço de e-mail e enviaremos um link para redefinir sua senha.",
        email: "E-mail",
        emailPlaceholder: "Digite seu e-mail",
        sendButton: "Enviar link de redefinição",
        sending: "Enviando...",
        backToSignIn: "Voltar para entrar",
        success:
          "E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.",
        error: "Ocorreu um erro. Por favor, tente novamente.",
      },
      resetPassword: {
        title: "Redefinir senha",
        subtitle: "Digite sua nova senha abaixo.",
        newPassword: "Nova senha",
        newPasswordPlaceholder: "Digite sua nova senha",
        confirmPassword: "Confirmar senha",
        confirmPasswordPlaceholder: "Confirme sua nova senha",
        resetButton: "Redefinir senha",
        resetting: "Redefinindo...",
        passwordMismatch: "As senhas não coincidem",
        weakPassword:
          "A senha deve ter pelo menos 8 caracteres e conter pelo menos uma letra maiúscula, uma letra minúscula e um número",
        success: "Senha redefinida com sucesso! Redirecionando para entrar...",
        error: "Ocorreu um erro. Por favor, tente novamente.",
        invalidToken: "Token de redefinição inválido ou expirado.",
        backToSignIn: "Voltar para entrar",
      },
      verifyEmail: {
        title: "Verifique seu e-mail",
        subtitle:
          "Enviamos um link de verificação para o seu endereço de e-mail.",
        checkInbox:
          "Por favor, verifique sua caixa de entrada e clique no link de verificação para ativar sua conta.",
        backToSignIn: "Voltar para entrar",
        error: "Ocorreu um erro. Por favor, tente novamente.",
        verified:
          "E-mail verificado com sucesso! Redirecionando para entrar...",
        invalidToken: "Token de verificação inválido ou expirado.",
      },
      verify2fa: {
        title: "Autenticação de dois fatores",
        subtitleTotp:
          "Digite o código de 6 dígitos do seu aplicativo autenticador",
        subtitleEmail: "Digite o código de 6 dígitos enviado para {email}",
        code: "Código de verificação",
        codePlaceholder: "Digite o código de 6 dígitos",
        verifyButton: "Verificar",
        verifying: "Verificando...",
        resendCode: "Não recebeu um código? Reenviar",
        codeSent: "Código de verificação enviado com sucesso",
        invalidCode: "Código de verificação inválido",
        error: "Ocorreu um erro. Por favor, tente novamente.",
      },
      postLogin: {
        preparing: "Preparando sua conta...",
      },
    },
    footer: {
      privacy: "Privacidade",
      terms: "Termos",
    },
    compare: {
      title: "Comparar Repositórios",
      subtitle: "Comparação lado a lado de saúde e métricas dos repositórios",
      empty: "Nenhum repositório com dados para comparar.",
      ranking: "Ranking de Repositórios",
      columns: {
        repository: "Repositório",
        stabilization: "Estabilização",
        revertRate: "Taxa de Revert",
        churn: "Churn",
        commits: "Commits",
        ai: "IA%",
        trend: "Tendência",
        health: "Saúde",
      },
      mobile: {
        revertRate: "Taxa de revert",
        trend: "Tendência",
      },
    },
    cliAuthorize: {
      metaTitle: "Autorizar CLI",
      title: "Autorizar CLI",
      subtitle: "Selecione uma organização para conectar seu terminal.",
      footnote: "Isso criará um token de API para acesso via CLI.",
      noOrgs: "Nenhuma organização encontrada. Crie uma primeiro no dashboard.",
      authorizeButton: "Autorizar",
      done: "Autorizado! Você pode fechar esta aba.",
      doneSubtitle: "Volte para o terminal.",
      authorizationFailed: "Falha na autorização",
      networkError: "Erro de rede. Tente novamente.",
      invalidRequest: {
        title: "Requisição Inválida",
        body: "Parâmetros obrigatórios ausentes. Execute {cmd} novamente.",
      },
    },
    acceptInvite: {
      invalid: {
        title: "Convite Inválido",
        description: "Este link de convite é inválido ou expirou.",
        noToken: "Nenhum token de convite encontrado na URL.",
      },
      processing: {
        title: "Processando Convite",
        description: "Aguarde enquanto processamos seu convite...",
      },
      result: {
        successTitle: "Convite Aceito!",
        successDescription: "Você entrou na organização com sucesso.",
        failedTitle: "Falha no Convite",
        failedDescription: "Houve um problema ao processar seu convite.",
      },
      goToDashboard: "Ir para o Dashboard",
      goToHomepage: "Ir para o Início",
      signIn: "Entrar",
      fallback: {
        title: "Carregando convite...",
        description:
          "Estamos preparando os detalhes do seu convite. Aguarde um momento.",
      },
      errors: {
        invalidLink: "Link de convite inválido. Nenhum token informado.",
        failedAccept: "Falha ao aceitar o convite",
        unexpected: "Ocorreu um erro inesperado",
      },
    },
    notFound: {
      title: "Página Não Encontrada",
      description:
        "Desculpe, não conseguimos encontrar a página que você procura. Ela pode ter sido removida ou a URL pode estar incorreta.",
      back: "Voltar ao Início",
    },
  },
  "es-ES": {
    common: {
      cancel: "Cancelar",
      error: "Error",
      close: "Cerrar",
      loading: "Cargando...",
    },
    publicNav: {
      faq: "FAQ",
      deck: "Deck",
      signIn: "Iniciar sesión",
      getStarted: "Comenzar",
      openMenu: "Abrir menú principal",
      githubAria: "GitHub",
    },
    home: {
      hero: {
        badge: "En acceso anticipado",
        title: "Inteligencia de ingeniería para la era de la IA",
        description:
          "Mide lo que sobrevive, no lo que se entrega. Iris analiza tus repositorios Git y revela si la IA está haciendo tu código más duradero — o solo más voluminoso. Detecta Copilot, Claude, Cursor, Windsurf y otras herramientas de IA automáticamente.",
        ctaPrimary: "Comenzar",
        ctaSecondary: "Ver un reporte",
        terminalCaption: "delivery-pulse.md",
      },
      problem: {
        title: "¿El código está realmente mejor — o solo hay más?",
        description:
          "Tu equipo adoptó herramientas de IA. Los commits aumentaron. Los PRs son más rápidos. Las métricas tradicionales dicen que todo va bien. Pero no puedes ver lo que se está rompiendo por debajo.",
        oldVelocity: "Velocidad",
        oldThroughput: "Throughput",
        oldCycleTime: "Cycle time",
        newStabilization: "Estabilización",
        newDurability: "Durabilidad",
        newSignalNoise: "Señal vs ruido",
      },
      provenData: {
        eyebrow: "Validado con datos reales",
        description:
          "Validado en una organización con 58 repositorios, 3.497 commits y 1.211 PRs fusionados.",
        stat1Label: "estabilización del código de IA vs código humano",
        stat2Label:
          'de los commits "humanos" coinciden con patrones de velocidad de IA',
        stat3Label:
          "de acoplamiento detectado en 4 implementaciones de cliente",
        stat4Label: "burst explicado por la línea de tiempo semanal",
      },
      howItWorks: {
        title: "Cómo funciona",
        installLabel: "1. Instalar",
        runLabel: "2. Ejecutar",
        readLabel: "3. Leer",
        readDescription:
          "Recibe un reporte en Markdown + métricas en JSON con delivery pulse, investigación de churn y análisis de impacto de la IA.",
        prLabel: "Opcional: revisar PRs",
        prDescription:
          "Analiza cualquier PR por composición de IA, riesgo de churn y riesgo de cascada. Publica los insights como comentario en el PR.",
      },
      modules: {
        title: "17 módulos de análisis",
        catAI: "Impacto de la IA",
        catTemporal: "Inteligencia temporal",
        catStructural: "Análisis estructural",
        catInfra: "Infraestructura",
        items: {
          originClassifier:
            "Atribución Humano / Asistido por IA / Bot por herramienta (Copilot, Claude, Cursor, Windsurf)",
          codeDurability:
            "Tasa de supervivencia de líneas por origen y herramienta",
          correctionCascades:
            "Patrones de correcciones en cadena por origen y herramienta",
          fixTargeting: "De qué origen el código atrae más bug fixes",
          acceptanceRate: "Supervivencia en code review por herramienta",
          originFunnel: "Commit → PR → Estabilizado → Sobreviviente",
          attributionGap: "Detección de alta velocidad sin atribución",
          prInsights: "Análisis de PR único con riesgo de churn y cascada",
          activityTimeline: "Desglose semanal con delivery pulse",
          trendAnalysis: "Comparación entre baseline y período reciente",
          patternDetection: "Bursts, períodos quiet, cambios de intención",
          stabilityMap: "Estabilización por directorio",
          churnInvestigation:
            "Detección de cadenas y acoplamiento entre archivos",
          commitShape: "Perfil estructural por origen",
          deliveryVelocity: "Correlación entre velocidad y durabilidad",
          primingDetection: "Archivos de contexto de IA (CLAUDE.md, etc.)",
          attributionHook: "prepare-commit-msg para herramientas de IA",
        },
      },
      positioning: {
        title: "Lo que Iris no es",
        notSurveillanceTitle: "No es una herramienta de vigilancia de devs",
        notSurveillanceDesc: "Analiza sistemas, nunca individuos",
        notRealtimeTitle: "No es un dashboard en tiempo real",
        notRealtimeDesc: "Reportes puntuales, no monitoreo en vivo",
        notIdeTitle: "No es un plugin de IDE",
        notIdeDesc: "Funciona solo desde el historial de Git",
        notProductivityTitle: "No es un tracker de productividad",
        notProductivityDesc: "Mide durabilidad, no velocidad",
      },
      cta: {
        title: "Pruébalo ahora",
        description:
          "Un comando. Corre localmente. La plataforma en la nube es opcional.",
        copy: "Copiar",
        copied: "¡Copiado!",
        requirements: "Python 3.11+ · Git · Cero dependencias",
      },
    },
    faqPage: {
      title: "Preguntas frecuentes",
      subtitle:
        "Todo lo que necesitas saber sobre Iris. ¿No encontraste lo que buscabas?",
      questions: {
        whatIsTitle: "¿Qué mide Iris?",
        whatIsAnswer:
          "Iris analiza tu historial de Git para revelar señales de calidad de entrega: estabilización, durabilidad del código, cascadas de corrección, brechas de atribución e impacto de la IA. Los reportes son puntuales, no monitoreo en vivo.",
        howWorksTitle: "¿Cómo funciona el análisis?",
        howWorksAnswer:
          "Ejecuta la CLI en cualquier repo. Lee commits, PRs y datos de supervivencia de código localmente, y genera un reporte Markdown + métricas JSON. El motor no depende de servicios en la nube.",
        aiToolsTitle: "¿Qué herramientas de IA detecta?",
        aiToolsAnswer:
          "Copilot, Claude, Cursor, Windsurf y otros asistentes se detectan vía metadatos de commits, trailers de co-autor y patrones de velocidad. Se pueden agregar herramientas nuevas vía hook prepare-commit-msg.",
        privacyTitle: "¿Iris lee mi código?",
        privacyAnswer:
          "El motor corre localmente y solo inspecciona metadatos de Git y diffs. Nada sale de tu máquina, salvo que conectes la plataforma en la nube opcional para agregación entre repos.",
        individualsTitle: "¿Hace ranking o score de devs?",
        individualsAnswer:
          "No. Iris está diseñado explícitamente para analizar sistemas, nunca individuos. No hay ranking de productividad, leaderboard por autor, ni score individual.",
        platformTitle: "¿Qué agrega la plataforma en la nube?",
        platformAnswer:
          "La plataforma agrega métricas entre repos y a lo largo del tiempo, ofrece dashboards a nivel de organización, detección de cambios y comparación entre repos. La CLI por sí sola es totalmente usable sin ella.",
        installTitle: "¿Cómo instalo?",
        installAnswer:
          "Ejecuta el script de instalación (curl -fsSL {appUrl}/install.sh | sh) o pipx install iris. Requiere Python 3.11+ y Git.",
        priceTitle: "¿Cuánto cuesta?",
        priceAnswer:
          "La CLI es gratuita y open source. La plataforma en la nube está en acceso anticipado con precio por uso — contáctanos para más detalles.",
        contributeTitle: "¿Cómo puedo contribuir o reportar problemas?",
        contributeAnswer:
          "El proyecto está en GitHub en RocketBus/clickbus-iris. Issues y PRs son bienvenidos.",
      },
    },
    footer: {
      privacy: "Privacidad",
      terms: "Términos",
      copyright: "Iris",
    },
    preferences: {
      language: {
        title: "Idioma",
        subtitle: "Elige tu idioma preferido",
        ptBR: "Portugués (Brasil)",
        enUS: "Inglés (EE. UU.)",
        esES: "Español",
        updated: "Preferencia de idioma actualizada",
      },
    },
    notFound: {
      title: "Página no encontrada",
      description:
        "Lo sentimos, no pudimos encontrar la página que buscas. Puede que haya sido eliminada o que la URL sea incorrecta.",
      back: "Volver al inicio",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = (typeof translations)["en-US"];
