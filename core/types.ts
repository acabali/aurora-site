// Shared types for the Aurora elite agent layer.
// These agents operate as post-processing reviewers over Aurora's decision outputs.

export interface CritiqueInput {
  decision_context: Record<string, unknown>;
  execution_plan: Record<string, unknown>;
  optimization_output: Record<string, unknown>;
  benchmark_output: Record<string, unknown>;
  executive_summary: string;
}

export interface CritiqueOutput {
  critique_score: number;
  hidden_assumptions: string[];
  strategic_risks: string[];
  weak_reasoning: string[];
  contradiction_flags: string[];
  generic_output_risk: number;
  executive_confidence: number;
  recommendation: "APPROVE" | "REVIEW" | "REJECT";
  meta: {
    agent: string;
    version: string;
    evaluated_at: string;
    input_hash: string;
  };
}

export interface ClarityInput {
  executive_summary: string;
  decision_context: Record<string, unknown>;
}

export interface ClarityOutput {
  clarity_score: number;
  executive_summary_rewritten: string;
  complexity_reduction_pct: number;
  jargon_removed: string[];
  decision_one_liner: string;
  business_risk_summary: string;
  meta: {
    agent: string;
    version: string;
    evaluated_at: string;
    pass: boolean;
  };
}

export interface DecisionPackage {
  decision_context: Record<string, unknown>;
  execution_plan: Record<string, unknown>;
  optimization_output: Record<string, unknown>;
  benchmark_output: Record<string, unknown>;
  executive_summary: string;
}

export interface OrchestratorV2Result {
  decision: Record<string, unknown>;
  optimization: Record<string, unknown>;
  benchmark: Record<string, unknown>;
  strategic_critique: CritiqueOutput;
  executive_clarity: ClarityOutput;
  export: {
    status: "ok" | "failed";
    timestamp: string;
    scores: {
      critique_score: number;
      executive_confidence: number;
      clarity_score: number;
      complexity_reduction_pct: number;
    };
  };
}

export interface ValidationResult {
  passed: boolean;
  failures: string[];
  scores: {
    critique_score: number;
    clarity_score: number;
    generic_output_risk: number;
    recommendation: string;
  };
}
