import { createHash } from "node:crypto";

type MovementInput = {
  capital?: unknown;
  absorption?: unknown;
  reversibility?: unknown;
  protocol?: unknown;
};

type MovementResult = {
  riskLevel: "BAJO" | "CONTROLADO" | "CRITICO";
  insight: string;
  counterfactual: string;
  decisionId: string;
  decisionHash: string;
};

function normalizeInput(input: MovementInput) {
  const capital = typeof input.capital === "number" && Number.isFinite(input.capital) ? Math.max(0, input.capital) : 0;
  const absorption = input.absorption === "no" || input.absorption === "restricted" || input.absorption === "yes"
    ? input.absorption
    : "yes";
  const reversibility = input.reversibility === "none" || input.reversibility === "partial" || input.reversibility === "full"
    ? input.reversibility
    : "full";
  const protocol = input.protocol === "vΩ" ? "vΩ" : "vΩ";

  return { capital, absorption, reversibility, protocol };
}

function computePressureScore(input: ReturnType<typeof normalizeInput>): number {
  const capitalScore = Math.min(input.capital / 100000, 0.5);
  const absorptionScore = input.absorption === "no" ? 0.35 : input.absorption === "restricted" ? 0.2 : 0.05;
  const reversibilityScore = input.reversibility === "none" ? 0.3 : input.reversibility === "partial" ? 0.18 : 0.04;

  return Math.min(1, Number((capitalScore + absorptionScore + reversibilityScore).toFixed(2)));
}

function riskLevelFromScore(score: number): MovementResult["riskLevel"] {
  if (score >= 0.75) {
    return "CRITICO";
  }

  if (score >= 0.4) {
    return "CONTROLADO";
  }

  return "BAJO";
}

function buildInsight(riskLevel: MovementResult["riskLevel"], input: ReturnType<typeof normalizeInput>): string {
  if (riskLevel === "CRITICO") {
    return `La presión estructural es crítica para ${input.protocol}: el capital expuesto supera la absorción disponible.`;
  }

  if (riskLevel === "CONTROLADO") {
    return `La presión estructural permanece controlada, pero la absorción ${input.absorption} exige seguimiento activo.`;
  }

  return "La presión estructural permanece baja y el movimiento conserva margen operativo.";
}

function buildCounterfactual(riskLevel: MovementResult["riskLevel"], input: ReturnType<typeof normalizeInput>): string {
  if (riskLevel === "CRITICO") {
    return input.reversibility === "none"
      ? "Con reversibilidad parcial y absorción restringida, el riesgo caería por debajo del umbral crítico."
      : "Reducir el capital comprometido o ampliar la absorción evitaría la zona crítica.";
  }

  if (riskLevel === "CONTROLADO") {
    return "Con reversibilidad total o mayor absorción, el movimiento migraría a riesgo bajo.";
  }

  return "Sin cambios adversos en absorción ni reversibilidad, el movimiento debería sostener riesgo bajo.";
}

function buildDecisionIdentifiers(input: ReturnType<typeof normalizeInput>): Pick<MovementResult, "decisionId" | "decisionHash"> {
  const normalized = JSON.stringify(input);
  const hash = createHash("sha256").update(normalized).digest("hex");
  const decisionHash = hash.slice(0, 8);
  const decisionId = `AUR-${hash.slice(0, 12).toUpperCase()}`;

  return { decisionId, decisionHash };
}

export function evaluateMovement(input: MovementInput): MovementResult {
  const normalizedInput = normalizeInput(input);
  const score = computePressureScore(normalizedInput);
  const riskLevel = riskLevelFromScore(score);
  const identifiers = buildDecisionIdentifiers(normalizedInput);

  return {
    riskLevel,
    insight: buildInsight(riskLevel, normalizedInput),
    counterfactual: buildCounterfactual(riskLevel, normalizedInput),
    decisionId: identifiers.decisionId,
    decisionHash: identifiers.decisionHash,
  };
}
