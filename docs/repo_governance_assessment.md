# Aurora OS — Repo Governance Assessment

**Date:** 2026-05-06
**Status:** Strategic reference — read-only analysis
**Scope:** aurora-os repository

---

## 1. Executive Summary

Aurora OS is accumulating coordination complexity faster than its governance structure can absorb.

The system has grown from a decision runtime into a multi-domain platform — orchestration, engines, agents, canonical data, MCP expansion, telemetry, validation, and now marketing agents — without a corresponding separation of concerns at the repo level. Everything lives in one working tree. The result is a masivamente dirty state where experimental work, runtime-critical code, and generated outputs coexist without isolation.

**The core problem is not AI intelligence. It is coordination overhead.**

The orchestrator, canonical layer, and agent runtime are tightly coupled. Any change in one domain risks cascading into others with no safety boundary. The repo does not currently distinguish between:
- code that must never break (runtime, canonical, orchestrator contracts)
- code that is actively experimental (marketing-agents, experiment-agent)
- code that is generated and should not be tracked (marketing_outputs, logs, dist)

Until these are separated, every new feature — including the StrategicCriticAgent and ExecutiveClarityAgent — introduces compounding integration risk.

**Risk level: HIGH.**

---

## 2. Domain Map

Confirmed domains and their current home in aurora-os:

| Domain | Location | Role | Stability |
|---|---|---|---|
| **Runtime** | `packages/agent-runtime` | Agent execution substrate | Critical |
| **Orchestration** | `src/aurora-orchestrator` | Pipeline sequencing and agent coordination | Critical |
| **Agents** | `src/aurora-agents` | Individual agent implementations | Medium |
| **Canonical** | `src/canonical` (inferred) | Shared data contracts, decision schemas | Critical |
| **Engines** | `engines/*` or `packages/*` | Scenario simulation, outcome intelligence, decision autopsy, timeline | High complexity |
| **Validation** | `packages/validation-system` | QA gates, score thresholds, output contracts | Medium |
| **Telemetry** | `packages/telemetry` | Observability, event emission | Medium |
| **Trace Layer** | `packages/trace-layer` | Execution tracing, audit log | Medium |
| **MCP** | `packages/mcp-*` or src (growing) | Model Context Protocol integrations | Expanding |
| **Marketing Agents** | `packages/marketing-agents` | Experimental — campaign and content agents | Experimental |
| **Web APIs** | `api/*` or `src/web` | External HTTP surface | Low-medium |
| **Tests** | `tests/*` or co-located | Coverage footprint | Incomplete |

---

## 3. Coupling Analysis

### Critical coupling risks

**Runtime ↔ Orchestrator**
The agent runtime and orchestrator are not cleanly separated. Changes to execution lifecycle in `packages/agent-runtime` likely require parallel changes in `src/aurora-orchestrator`. There is no stable contract layer between them that would allow one to evolve independently.

**Orchestrator ↔ Canonical**
The orchestrator references canonical types directly. If canonical schemas change, orchestrator logic breaks. The canonical layer should be an immutable contract layer that the orchestrator imports from — not co-evolves with.

**Engines ↔ Orchestrator**
`scenario-simulation-v2`, `outcome-intelligence`, `decision-autopsy`, and `timeline-engine` are likely imported and invoked inside the orchestrator pipeline. Their stage order and output contracts are baked into orchestrator logic rather than declared in a registry. Adding or removing an engine requires editing the orchestrator.

**Marketing Agents ↔ Core Runtime**
If `packages/marketing-agents` imports from `packages/agent-runtime`, experimental marketing work can destabilize the runtime baseline. These two domains should have zero shared mutable state.

**Trace Layer ↔ Everything**
A trace/telemetry layer that is instrumented across multiple packages creates a horizontal dependency. Any breaking change in `packages/trace-layer` propagates everywhere it is imported.

---

## 4. Stability Risk Assessment

| Domain | Risk Level | Reason |
|---|---|---|
| `packages/agent-runtime` | **HIGH** | Foundation for all agents — breakage is total |
| `src/aurora-orchestrator` | **HIGH** | Coordinates entire pipeline — no isolation |
| `src/canonical` | **HIGH** | Shared contracts — downstream breakage is silent |
| `engines/*` | **MEDIUM-HIGH** | Complex logic, likely under active development |
| `packages/validation-system` | **MEDIUM** | QA gates — if broken, bad outputs pass |
| `packages/trace-layer` | **MEDIUM** | Cross-cutting — silent failures possible |
| `packages/telemetry` | **MEDIUM** | Observability loss if broken, not runtime failure |
| `src/aurora-agents` | **MEDIUM** | Individual agents — failure is local if well-isolated |
| `packages/marketing-agents` | **LOW-MEDIUM** | Experimental — but risky if coupled to runtime |
| `experiment-agent` | **LOW** | Contained experiment — risk is isolation quality |
| `marketing_outputs` | **LOW** | Generated artifacts — should not be in repo |

---

## 5. Canonical Layer Risk

The canonical layer is the single most important governance surface in Aurora OS.

It defines the shared decision schemas, agent I/O contracts, and data shapes that every other domain depends on. If canonical is unstable or evolving without versioning, the entire system is unstable — even if every individual agent works correctly in isolation.

**Current risks:**
- No evidence of explicit versioning on canonical types
- Orchestrator and agents likely import canonical types directly rather than through a versioned interface
- Schema changes propagate silently — TypeScript will catch obvious breaks but not semantic drift
- No canonical stability gate exists in the known architecture

**Governance recommendations:**
- Declare canonical as frozen until baseline is stable
- Any change to canonical requires explicit review and a version bump
- No agent, engine, or orchestrator change should require canonical modification — canonical changes are infrastructure changes, not feature changes
- Introduce a `packages/canonical` or `src/contracts` boundary with explicit exports

---

## 6. Engine Isolation Assessment

Four engines are known to be active:

| Engine | Risk | Notes |
|---|---|---|
| `scenario-simulation-v2` | HIGH | "v2" suggests active iteration — v1 may still be coupled |
| `outcome-intelligence` | HIGH | Likely feeds into executive summaries and decision output |
| `decision-autopsy` | MEDIUM | Post-mortem analysis — probably reads, not writes |
| `timeline-engine` | MEDIUM | Temporal modeling — scope unclear |

**Critical issue:** The "v2" suffix on scenario-simulation implies a v1 exists and may still be referenced. If both are in the repo and partially coupled through the orchestrator, this is a live conflict risk.

**Recommendation:** Each engine should expose a stable interface contract and be invokable as an isolated module. The orchestrator should not contain engine logic — only sequence calls to engine interfaces.

---

## 7. MCP Expansion Analysis

MCP (Model Context Protocol) is expanding inside aurora-os. This creates specific governance risks:

**Growth risk:** MCP integrations tend to grow as new tools are added. Without a registry pattern, each new MCP integration becomes an ad-hoc import in the orchestrator or agents — increasing coupling and surface area.

**Version risk:** MCP protocol versions can change. If MCP clients are scattered across packages rather than centralized, a protocol update requires hunting down every integration point.

**Scope risk:** MCP integrations blur the boundary between Aurora's internal logic and external tool calls. This boundary needs explicit governance — which calls are internal, which are external, and what happens when an external MCP call fails.

**Governance recommendation:** Establish a `packages/mcp-platform` boundary that centralizes all MCP client management. Other packages call through this interface, never directly.

---

## 8. Current Bottleneck

**The bottleneck in Aurora OS is not AI intelligence. It is governance and coordination complexity.**

Aurora has strong individual components: capable engines, a functional orchestrator, growing agent coverage, and expanding MCP integrations. The constraint is the absence of explicit domain boundaries that allow these components to evolve without interfering with each other.

The specific manifestations:
- One working tree holds critical runtime code, experimental agents, and generated outputs with no separation
- The orchestrator is a coordination hub instead of a thin sequencer over stable interfaces
- The canonical layer has no explicit stability contract
- New agents (including StrategicCriticAgent and ExecutiveClarityAgent) cannot be safely added until insertion points are stable

**Until governance is established, adding intelligence makes the system harder to govern, not smarter.**
