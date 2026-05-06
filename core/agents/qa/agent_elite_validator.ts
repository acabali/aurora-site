import type { CritiqueOutput, ClarityOutput, ValidationResult } from "../../types.js";

const CRITIQUE_SCORE_MIN = 70;
const CLARITY_SCORE_MIN = 70;
const GENERIC_RISK_MAX = 0.3;

export function validateEliteAgents(
  critique: CritiqueOutput,
  clarity: ClarityOutput
): ValidationResult {
  const failures: string[] = [];

  if (critique.critique_score < CRITIQUE_SCORE_MIN) {
    failures.push(
      `critique_score ${critique.critique_score} is below minimum ${CRITIQUE_SCORE_MIN}`
    );
  }

  if (clarity.clarity_score < CLARITY_SCORE_MIN) {
    failures.push(
      `clarity_score ${clarity.clarity_score} is below minimum ${CLARITY_SCORE_MIN}`
    );
  }

  if (critique.generic_output_risk > GENERIC_RISK_MAX) {
    failures.push(
      `generic_output_risk ${critique.generic_output_risk.toFixed(2)} exceeds maximum ${GENERIC_RISK_MAX}`
    );
  }

  if (critique.recommendation === "REJECT") {
    failures.push(`StrategicCriticAgent recommendation is REJECT — output blocked`);
  }

  return {
    passed: failures.length === 0,
    failures,
    scores: {
      critique_score: critique.critique_score,
      clarity_score: clarity.clarity_score,
      generic_output_risk: critique.generic_output_risk,
      recommendation: critique.recommendation,
    },
  };
}

export function assertEliteValidation(critique: CritiqueOutput, clarity: ClarityOutput): void {
  const result = validateEliteAgents(critique, clarity);
  if (!result.passed) {
    throw new Error(
      `[AgentEliteValidator] FAILED:\n${result.failures.map((f) => `  - ${f}`).join("\n")}`
    );
  }
}
