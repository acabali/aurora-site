# Aurora OS — Repo Cleanup & Stabilization Plan

**Date:** 2026-05-06
**Status:** Strategic plan — no implementation until baseline is validated
**Scope:** aurora-os repository
**Precondition:** Read `repo_governance_assessment.md` first

---

## Principle

Clean before build. Every new agent, engine, or integration added to a dirty repo
inherits the existing coordination debt. Stabilize first. Integrate after.

---

## 1. Runtime Noise — What Should Not Live in the Repo

These categories of files should be gitignored or removed from tracking:

### Generated outputs
```
marketing_outputs/          # Runtime-generated — not source code
dist/                       # Build artifacts
*.js.map                    # Source maps
*.d.ts.map                  # Declaration maps (if generated)
```

### Logs and runtime artifacts
```
logs/
*.log
*.jsonl                     # Runtime trace logs (unless curated as fixtures)
*.ndjson
var/
.cache/
```

### Experiment artifacts
```
experiment-agent/output/    # Any generated output from experiment-agent
**/scratch/
**/tmp/
```

### Build and dependency noise
```
node_modules/
dist/
.turbo/
.next/
.astro/
```

**Action:** Audit `.gitignore` in aurora-os. Add all of the above that are missing.
Untrack any already-committed generated files with `git rm --cached`.

---

## 2. Dirty State Triage

Classification framework for all uncommitted changes in aurora-os:

| Category | Definition | Action |
|---|---|---|
| **Safe to commit** | Isolated, tested, non-breaking changes to a single domain | Commit with scoped message |
| **Experimental** | marketing-agents, experiment-agent, exploratory engines | Isolate to feature branch |
| **Generated/runtime** | marketing_outputs, logs, dist, *.jsonl | Gitignore + untrack |
| **High-risk** | Changes touching orchestrator, canonical, agent-runtime contracts | Freeze — review before any commit |
| **Unknown** | Files with unclear domain ownership or purpose | Do not commit — investigate first |

### Triage questions for each changed file

1. Which domain does this belong to? (runtime / orchestration / agents / canonical / engines / MCP / marketing / test)
2. Does it touch a contract used by other domains?
3. Is it generated or authored?
4. Is it experimental or production-intent?
5. Does it have a corresponding test?

---

## 3. Domain Separation Plan

Each domain should eventually live in an isolated branch before merging to main.
This prevents cross-domain contamination during stabilization.

| Domain | Current State | Target Branch | Priority |
|---|---|---|---|
| Runtime | Dirty, coupled | `feat/runtime-stabilization` | **1 — first** |
| Canonical/Contracts | Unversioned, critical | Freeze on main | **1 — first** |
| Orchestrator | Coupled to runtime | `feat/runtime-stabilization` | **2** |
| Engines | Active iteration | `feat/engine-isolation` | **3** |
| MCP | Growing | `feat/mcp-platform` | **3** |
| Validation | Medium stability | `feat/telemetry-hardening` | **4** |
| Telemetry/Trace | Cross-cutting | `feat/telemetry-hardening` | **4** |
| Marketing Agents | Experimental | `feat/marketing-agents` | **5 — isolated** |
| Web APIs | Low coupling | `feat/web-separation` | **5** |
| experiment-agent | Exploratory | `feat/marketing-agents` or discard | **6 — last** |

---

## 4. Freeze Recommendations

These items should be frozen (no changes accepted) until baseline is stable:

### Freeze immediately

**`src/canonical` (or equivalent contracts layer)**
Any schema or type change here propagates to every dependent domain.
No changes until all domains have been triaged and stabilized.

**`packages/agent-runtime` public interface**
The execution substrate cannot move while everything else is unstable.
Internal refactors may proceed on a dedicated branch with full test coverage.

**`src/aurora-orchestrator` stage sequence**
The order and contracts of pipeline stages must not change during triage.
Adding stages (like critique or clarity) waits until this is stable.

### Freeze after triage

**`packages/validation-system` thresholds**
Score thresholds should not drift during stabilization — they are the QA baseline.

**`packages/trace-layer` public API**
Cross-cutting changes have maximum blast radius.

---

## 5. Branch Strategy

Proposed branch structure for stabilization work:

```
main
├── feat/runtime-stabilization
│   ├── scope: packages/agent-runtime, src/aurora-orchestrator
│   ├── goal: clean contract between runtime and orchestrator
│   └── gate: all existing agent tests pass
│
├── feat/engine-isolation
│   ├── scope: engines/* (scenario-simulation, outcome-intelligence,
│   │         decision-autopsy, timeline-engine)
│   ├── goal: each engine exposes stable interface, no engine logic in orchestrator
│   └── gate: engine interfaces documented and stable
│
├── feat/mcp-platform
│   ├── scope: all MCP integrations
│   ├── goal: centralized MCP client management in packages/mcp-platform
│   └── gate: no direct MCP calls outside mcp-platform boundary
│
├── feat/telemetry-hardening
│   ├── scope: packages/telemetry, packages/trace-layer, packages/validation-system
│   ├── goal: observability and QA as stable, non-breaking cross-cutting concerns
│   └── gate: trace and telemetry do not break if temporarily disabled
│
├── feat/web-separation
│   ├── scope: web API layer
│   ├── goal: no runtime logic in web handlers
│   └── gate: web layer is stateless relay to runtime
│
└── feat/marketing-agents
    ├── scope: packages/marketing-agents, experiment-agent
    ├── goal: complete isolation from core runtime
    └── gate: zero imports from packages/agent-runtime
```

**Rule:** No cross-branch merges until each branch passes its gate condition.
**Rule:** `main` only receives merges from branches with passing gates.
**Rule:** `feat/runtime-stabilization` merges first — everything else depends on it.

---

## 6. Baseline Stabilization Plan

Sequential steps to recover a governable baseline:

### Step 1 — Gitignore cleanup (no code changes)
- Audit and update `.gitignore`
- Untrack generated files
- Remove `marketing_outputs`, logs, dist from tracking

### Step 2 — Triage current dirty state
- Classify every uncommitted change using the triage table in Section 2
- Do not commit anything classified as high-risk or unknown

### Step 3 — Freeze canonical and runtime
- Declare `src/canonical` and `packages/agent-runtime` public interface as frozen
- Document the freeze in `FROZEN.md` or equivalent

### Step 4 — Create isolation branches
- Create `feat/marketing-agents` and move all marketing/experiment work there
- This unblocks runtime stabilization on main

### Step 5 — Commit safe changes
- Only safe-to-commit, single-domain changes go to main in this phase
- Each commit is scoped: one domain, one message, one purpose

### Step 6 — Stabilize runtime/orchestrator contract
- On `feat/runtime-stabilization`: clean the interface between agent-runtime and orchestrator
- Document the contract explicitly

### Step 7 — Validate baseline
- All known agents pass their existing tests
- Orchestrator pipeline runs end-to-end on a reference decision
- Telemetry and trace emit correctly
- No cross-domain imports in experimental domains

---

## 7. Integration Readiness

**StrategicCriticAgent and ExecutiveClarityAgent must NOT be integrated until:**

| Condition | Reason |
|---|---|
| `packages/agent-runtime` public interface is stable and documented | Agents depend on runtime execution substrate |
| `src/aurora-orchestrator` stage sequence is frozen | Insertion point must be known and stable |
| `src/canonical` types are versioned and frozen | Agent I/O contracts must map to stable canonical types |
| `packages/validation-system` thresholds are documented | QA gate must exist before adding new scoring dimensions |
| `feat/marketing-agents` is isolated from main | Experimental work must not pollute the integration surface |
| `packages/trace-layer` is stable | New agents need reliable trace hooks — not experimental ones |
| Dirty state is triaged and committed/discarded | A dirty main makes integration diffs unreadable and rollback impossible |

**Until all seven conditions are met, adding new elite agents increases risk, not capability.**

### Rollback posture for future integration

When conditions are met, each new agent integration should:
1. Live on a dedicated branch (e.g., `feat/elite-critique-layer`)
2. Touch exactly two files in orchestrator (import + stage call)
3. Add one new file per agent (no modifications to existing agents)
4. Have a feature flag or passthrough fallback in orchestrator (if agent throws, pipeline continues)
5. Be reverted by removing two lines in orchestrator — no cascading changes needed
