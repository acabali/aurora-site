import { sha256 } from "./hash";

type MovementInput = {
  capital?: number;
  absorption?: "yes" | "restricted" | "no";
  reversibility?: "full" | "partial" | "none";
  protocol?: string;
};

type MovementResult = {
  riskLevel: "BAJO" | "CONTROLADO" | "CRITICO";
  insight: string;
  counterfactual: string;
  decisionId: string;
  decisionHash: string;
};

function toRiskLevel(score: number): MovementResult["riskLevel"] {
  if (score >= 0.7) return "CRITICO";
  if (score >= 0.4) return "CONTROLADO";
  return "BAJO";
}

function buildInsight(score: number, absorption: string, reversibility: string): string {
  if (score >= 0.7) {
    return "La presión estructural es crítica para vΩ: el capital expuesto supera la absorción disponible.";
  }
  if (score >= 0.4) {
    return `La presión estructural está contenida pero exige atención: absorción ${absorption} y reversibilidad ${reversibility}.`;
  }
  return "La presión estructural es baja: el movimiento conserva margen operativo.";
}

function buildCounterfactual(score: number): string {
  if (score >= 0.7) {
    return "Reducir el capital comprometido o ampliar la absorción evitaría la zona crítica.";
  }
  if (score >= 0.4) {
    return "Aumentar la reversibilidad o mejorar la absorción reduciría la presión del movimiento.";
  }
  return "Si la absorción empeora o la reversibilidad cae, el riesgo subiría un nivel.";
}

export async function evaluateMovement(input: MovementInput): Promise<MovementResult> {
  const capital = Number(input.capital ?? 0);
  const absorption = input.absorption ?? "restricted";
  const reversibility = input.reversibility ?? "partial";
  const protocol = input.protocol ?? "vΩ";

  const capitalFactor = Math.min(capital / 100000, 1);
  const absorptionFactor =
    absorption === "no" ? 1 : absorption === "restricted" ? 0.6 : 0.2;
  const reversibilityFactor =
    reversibility === "none" ? 1 : reversibility === "partial" ? 0.6 : 0.2;

  const score = Math.min(
    capitalFactor * 0.45 + absorptionFactor * 0.35 + reversibilityFactor * 0.2,
    1,
  );

  const riskLevel = toRiskLevel(score);
  const seed = `${capital}|${absorption}|${reversibility}|${protocol}|${riskLevel}`;
  const decisionHash = await sha256(seed);
  const decisionId = `AUR-${decisionHash.toUpperCase()}`;

  return {
    riskLevel,
    insight: buildInsight(score, absorption, reversibility),
    counterfactual: buildCounterfactual(score),
    decisionId,
    decisionHash,
  };
}
