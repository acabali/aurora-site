import { runStrategicCritic } from "../agents/critique/strategic_critic_agent.js";
import { runExecutiveClarity } from "../agents/executive/executive_clarity_agent.js";
import type {
  DecisionPackage,
  OrchestratorV2Result,
  CritiqueOutput,
  ClarityOutput,
} from "../types.js";

// Pipeline: decision → optimization → benchmark → strategic_critique → executive_clarity → export

export interface OrchestratorV2Options {
  skipCritiqueOnApprove?: boolean;
  writeArtifacts?: boolean;
  artifactsDir?: string;
}

type FsWriteFile = (path: string, data: string, encoding: string) => Promise<void>;
type FsMkdir = (path: string, opts: { recursive: boolean }) => Promise<unknown>;
type PathDirname = (path: string) => string;

declare function require(module: string): unknown;

async function writeJsonArtifact(filePath: string, data: unknown): Promise<void> {
  // Dynamic import at call-site avoids bundling fs in browser contexts
  const fs = (await import("node:fs/promises")) as { writeFile: FsWriteFile; mkdir: FsMkdir };
  const pathMod = (await import("node:path")) as { dirname: PathDirname };
  await fs.mkdir(pathMod.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function runOrchestratorV2(
  pkg: DecisionPackage,
  options: OrchestratorV2Options = {}
): Promise<OrchestratorV2Result> {
  const { writeArtifacts = false, artifactsDir = "artifacts/agent_system_v2/elite_agents" } =
    options;

  // Stage 1: decision (passed in via pkg.decision_context — runtime owns this)
  const decision = pkg.decision_context;

  // Stage 2: optimization (passed in via pkg.optimization_output — runtime owns this)
  const optimization = pkg.optimization_output;

  // Stage 3: benchmark (passed in via pkg.benchmark_output — runtime owns this)
  const benchmark = pkg.benchmark_output;

  // Stage 4: strategic_critique
  let strategicCritique: CritiqueOutput;
  try {
    strategicCritique = await runStrategicCritic({
      decision_context: decision,
      execution_plan: pkg.execution_plan,
      optimization_output: optimization,
      benchmark_output: benchmark,
      executive_summary: pkg.executive_summary,
    });
  } catch (err) {
    strategicCritique = {
      critique_score: 0,
      hidden_assumptions: [],
      strategic_risks: [`StrategicCriticAgent failed: ${String(err)}`],
      weak_reasoning: [],
      contradiction_flags: [],
      generic_output_risk: 1.0,
      executive_confidence: 0,
      recommendation: "REJECT",
      meta: {
        agent: "StrategicCriticAgent",
        version: "1.0.0",
        evaluated_at: new Date().toISOString(),
        input_hash: "",
      },
    };
  }

  if (writeArtifacts) {
    await writeJsonArtifact(`${artifactsDir}/critique_report.json`, strategicCritique);
  }

  // Stage 5: executive_clarity
  let executiveClarity: ClarityOutput;
  try {
    executiveClarity = await runExecutiveClarity({
      executive_summary: pkg.executive_summary,
      decision_context: decision,
    });
  } catch (err) {
    executiveClarity = {
      clarity_score: 0,
      executive_summary_rewritten: pkg.executive_summary,
      complexity_reduction_pct: 0,
      jargon_removed: [],
      decision_one_liner: "Clarity evaluation failed.",
      business_risk_summary: `ExecutiveClarityAgent failed: ${String(err)}`,
      meta: {
        agent: "ExecutiveClarityAgent",
        version: "1.0.0",
        evaluated_at: new Date().toISOString(),
        pass: false,
      },
    };
  }

  if (writeArtifacts) {
    await writeJsonArtifact(`${artifactsDir}/executive_clarity_report.json`, executiveClarity);
  }

  // Stage 6: export
  const exportRecord = {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    scores: {
      critique_score: strategicCritique.critique_score,
      executive_confidence: strategicCritique.executive_confidence,
      clarity_score: executiveClarity.clarity_score,
      complexity_reduction_pct: executiveClarity.complexity_reduction_pct,
    },
  };

  return {
    decision,
    optimization,
    benchmark,
    strategic_critique: strategicCritique,
    executive_clarity: executiveClarity,
    export: exportRecord,
  };
}
