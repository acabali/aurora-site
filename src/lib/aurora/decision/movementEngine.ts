import type {
  AuroraRiskLevel,
  DecisionCash30d,
  DecisionInput,
  DecisionNature,
  DecisionReversibility,
} from "./types";
import { normalizeDecisionInput } from "./types";
import { sha256 } from "./hash";

type MovementResult = {
  riskLevel: AuroraRiskLevel;
  insight: string;
  counterfactual: string;
  decisionId: string;
  decisionHash: string;
  pressureScore: number;
  pressureDay: number;
  structuralLoad: "BAJA" | "MEDIA" | "ALTA";
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

function toRiskLevel(score: number): AuroraRiskLevel {
  if (score >= 0.72) return "RIESGO_CRITICO";
  if (score >= 0.45) return "RIESGO_CONTROLADO";
  return "RIESGO_BAJO";
}

function cashPressure(value: DecisionCash30d): number {
  if (value === "ALTA") return 1;
  if (value === "MEDIA") return 0.6;
  return 0.2;
}

function reversibilityPressure(value: DecisionReversibility): number {
  if (value === "BAJA") return 1;
  if (value === "MEDIA") return 0.6;
  return 0.2;
}

function naturePressure(value: DecisionNature): number {
  return value === "RECURRENTE" ? 1 : 0.45;
}

function pressureDay(value: DecisionCash30d): number {
  if (value === "ALTA") return 7;
  if (value === "MEDIA") return 21;
  return 45;
}

function structuralLoad(
  reversibility: DecisionReversibility,
  nature: DecisionNature,
): MovementResult["structuralLoad"] {
  if (reversibility === "BAJA" || nature === "RECURRENTE") return "ALTA";
  if (reversibility === "MEDIA") return "MEDIA";
  return "BAJA";
}

function buildInsight(input: DecisionInput, score: number): string {
  if (score >= 0.72) {
    return `La presión estructural es crítica: ${input.category} compromete caja a 30 días ${input.cash_30d} con reversibilidad ${input.reversibility}.`;
  }

  if (score >= 0.45) {
    return `La presión estructural está contenida pero exige atención: caja a 30 días ${input.cash_30d} y reversibilidad ${input.reversibility}.`;
  }

  return `La presión estructural es baja: ${input.category} conserva margen operativo para ${input.industry ?? "General"}.`;
}

function buildCounterfactual(input: DecisionInput, score: number): string {
  if (score >= 0.72) {
    return "Reducir el monto comprometido o mejorar la caja a 30 dias evitaría la zona crítica.";
  }

  if (score >= 0.45) {
    return `Aumentar la reversibilidad por encima de ${input.reversibility} o bajar la presión de caja reduciría el riesgo.`;
  }

  return "Si la caja a 30 dias empeora o la reversibilidad cae, el riesgo subiría un nivel.";
}

export async function evaluateMovement(input: DecisionInput | unknown): Promise<MovementResult> {
  const normalized = normalizeDecisionInput(input);
  const amountFactor = clamp(normalized.amount / 100000);
  const cashFactor = cashPressure(normalized.cash_30d);
  const reversibilityFactor = reversibilityPressure(normalized.reversibility);
  const natureFactor = naturePressure(normalized.nature);

  const score = clamp(
    amountFactor * 0.45 +
      cashFactor * 0.25 +
      reversibilityFactor * 0.2 +
      natureFactor * 0.1,
  );

  const riskLevel = toRiskLevel(score);
  const decisionHash = await sha256(
    JSON.stringify({
      amount: normalized.amount,
      cash_30d: normalized.cash_30d,
      nature: normalized.nature,
      category: normalized.category,
      reversibility: normalized.reversibility,
      industry: normalized.industry ?? "General",
      riskLevel,
    }),
  );

  return {
    riskLevel,
    insight: buildInsight(normalized, score),
    counterfactual: buildCounterfactual(normalized, score),
    decisionId: `dec_${decisionHash}`,
    decisionHash,
    pressureScore: Math.round(score * 100),
    pressureDay: pressureDay(normalized.cash_30d),
    structuralLoad: structuralLoad(normalized.reversibility, normalized.nature),
  };
}
