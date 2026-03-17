import type {
  AuroraDecisionRequest,
  AuroraDecisionResponse,
  AuroraDecisionRiskLevel,
} from "./types";

function createStableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function getRiskLevel(score: number): AuroraDecisionRiskLevel {
  if (score >= 9) {
    return "RIESGO_CRITICO";
  }

  if (score >= 5) {
    return "RIESGO_CONTROLADO";
  }

  return "RIESGO_BAJO";
}

function getDominantVariable(input: AuroraDecisionRequest, score: number): string {
  if (input.cashCommitment30d === "ALTA") {
    return "La liquidez disponible";
  }

  if (input.reversibility === "BAJA") {
    return "La irreversibilidad del movimiento";
  }

  if (input.nature === "RECURRENTE") {
    return "La carga fija que queda activa despues del movimiento";
  }

  if (score >= 5) {
    return "La presion combinada entre caja y margen de correccion";
  }

  return "La capacidad del sistema para absorber el movimiento sin desplazar su eje operativo";
}

function getCounterfactual(input: AuroraDecisionRequest, riskLevel: AuroraDecisionRiskLevel): string {
  if (riskLevel === "RIESGO_CRITICO") {
    return "Si el movimiento se fragmenta, baja el compromiso de caja o sube la reversibilidad, la presion estructural cae de inmediato.";
  }

  if (riskLevel === "RIESGO_CONTROLADO") {
    return "Si el movimiento entra por fases y conserva capacidad de correccion, el sistema mantiene margen operativo sin cerrar la ventana.";
  }

  if (input.category === "ADQUISICION_PAGA") {
    return "Si la adquisicion paga exige recurrencia antes de validar absorcion, el riesgo sube hacia zona controlada.";
  }

  return "Si el movimiento se vuelve recurrente o pierde reversibilidad, la lectura sale de zona estable y obliga a recalcular.";
}

function getEvidence(input: AuroraDecisionRequest, dominantVariable: string): string[] {
  return [
    `Monto declarado: USD ${Math.round(input.amount).toLocaleString("en-US")}`,
    `Caja comprometida 30d: ${input.cashCommitment30d}`,
    `Naturaleza del movimiento: ${input.nature}`,
    `Categoria operativa: ${input.category}`,
    `Reversibilidad declarada: ${input.reversibility}`,
    `Industria declarada: ${input.industry}`,
    `Variable dominante: ${dominantVariable}`,
  ];
}

export function evaluateMovement(input: AuroraDecisionRequest): AuroraDecisionResponse {
  let score = 0;

  if (input.amount >= 250000) {
    score += 3;
  } else if (input.amount >= 100000) {
    score += 2;
  } else if (input.amount >= 40000) {
    score += 1;
  }

  if (input.cashCommitment30d === "MEDIA") {
    score += 2;
  } else if (input.cashCommitment30d === "ALTA") {
    score += 4;
  }

  if (input.nature === "RECURRENTE") {
    score += 2;
  }

  if (input.category === "EQUIPAMIENTO") {
    score += 1;
  } else if (input.category === "ADQUISICION_PAGA") {
    score += 2;
  }

  if (input.reversibility === "MEDIA") {
    score += 2;
  } else if (input.reversibility === "BAJA") {
    score += 4;
  }

  if (input.industry === "FINTECH" || input.industry === "LOGISTICA") {
    score += 1;
  }

  const riskLevel = getRiskLevel(score);
  const dominantVariable = getDominantVariable(input, score);
  const serializedInput = JSON.stringify(input);
  const hash = createStableHash(serializedInput);
  const decisionHash = `AUR-${hash}`;
  const decisionId = `AUR-${hash.slice(0, 6)}`;

  const insight =
    riskLevel === "RIESGO_CRITICO"
      ? `${dominantVariable}. La configuracion actual concentra demasiado compromiso para el margen de correccion disponible.`
      : riskLevel === "RIESGO_CONTROLADO"
        ? `${dominantVariable}. El movimiento sigue siendo viable, pero entra con presion suficiente como para exigir secuencia y control.`
        : `${dominantVariable}. El sistema puede absorber el movimiento sin abrir una compresion dominante inmediata.`;

  return {
    riskLevel,
    insight,
    counterfactual: getCounterfactual(input, riskLevel),
    decisionId,
    decisionHash,
    evidence: getEvidence(input, dominantVariable),
  };
}
