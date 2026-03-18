export const DECISION_ABSORPTION_OPTIONS = ["yes", "restricted", "no"] as const;
export const DECISION_REVERSIBILITY_OPTIONS = ["full", "partial", "none"] as const;
export const DECISION_PROTOCOL_OPTIONS = ["vΩ"] as const;
export const LEGACY_DECISION_RISK_LEVEL_OPTIONS = ["BAJO", "CONTROLADO", "CRITICO"] as const;
export const DECISION_RISK_LEVEL_OPTIONS = [
  "RIESGO_BAJO",
  "RIESGO_CONTROLADO",
  "RIESGO_CRITICO",
] as const;
export const DECISION_CASH_30D_OPTIONS = ["BAJA", "MEDIA", "ALTA"] as const;
export const DECISION_NATURE_OPTIONS = ["UNICO", "RECURRENTE"] as const;
export const DECISION_CANON_REVERSIBILITY_OPTIONS = ["ALTA", "MEDIA", "BAJA"] as const;
export const DECISION_STRUCTURAL_LOAD_OPTIONS = ["BAJA", "MEDIA", "ALTA"] as const;

export type AuroraDecisionAbsorption = (typeof DECISION_ABSORPTION_OPTIONS)[number];
export type AuroraDecisionReversibility = (typeof DECISION_REVERSIBILITY_OPTIONS)[number];
export type AuroraDecisionProtocol = (typeof DECISION_PROTOCOL_OPTIONS)[number];
export type LegacyAuroraDecisionRiskLevel =
  (typeof LEGACY_DECISION_RISK_LEVEL_OPTIONS)[number];
export type AuroraRiskLevel = (typeof DECISION_RISK_LEVEL_OPTIONS)[number];
export type AuroraDecisionRiskLevel = AuroraRiskLevel;
export type DecisionCash30d = (typeof DECISION_CASH_30D_OPTIONS)[number];
export type DecisionNature = (typeof DECISION_NATURE_OPTIONS)[number];
export type DecisionReversibility = (typeof DECISION_CANON_REVERSIBILITY_OPTIONS)[number];
export type DecisionStructuralLoad = (typeof DECISION_STRUCTURAL_LOAD_OPTIONS)[number];

export interface AuroraDecisionRequest {
  capital: number;
  absorption: AuroraDecisionAbsorption;
  reversibility: AuroraDecisionReversibility;
  protocol: AuroraDecisionProtocol;
}

export interface LegacyDecisionRequest extends AuroraDecisionRequest {}

export interface DecisionInput {
  amount: number;
  cash_30d: DecisionCash30d;
  nature: DecisionNature;
  category: string;
  reversibility: DecisionReversibility;
  industry?: string;
}

export interface LegacyDecisionResponse {
  risk_level: LegacyAuroraDecisionRiskLevel;
  insight: string;
  counterfactual: string;
  decision_id: string;
  decision_hash: string;
}

export interface DecisionCreative {
  hook: string;
  angle: string;
}

export interface DecisionResponse {
  risk_level: AuroraRiskLevel;
  insight: string;
  counterfactual: string;
  decision_id: string;
  decision_hash: string;
  pressure_score?: number;
  pressure_day?: number;
  structural_load?: DecisionStructuralLoad;
}

export type AuroraDecisionResponse = DecisionResponse;

export interface AuroraDecisionEnvelope {
  data: AuroraDecisionResponse;
  source: "remote" | "local";
  creatives?: DecisionCreative[];
}

export interface AuroraDecisionErrorShape {
  code: "validation" | "network" | "auth" | "server" | "unknown";
  message: string;
  retriable: boolean;
  status?: number;
}

export type DemoViewStateStatus = "idle" | "loading" | "success" | "error";

export interface DemoViewState {
  status: DemoViewStateStatus;
  request: AuroraDecisionRequest;
  result: AuroraDecisionEnvelope | null;
  error: AuroraDecisionErrorShape | null;
}

export const DECISION_ABSORPTION_LABEL: Record<AuroraDecisionAbsorption, string> = {
  yes: "Absorción completa",
  restricted: "Absorción restringida",
  no: "Sin absorción",
};

export const DECISION_REVERSIBILITY_LABEL: Record<AuroraDecisionReversibility, string> = {
  full: "Reversibilidad total",
  partial: "Reversibilidad parcial",
  none: "Sin reversibilidad",
};

export const DECISION_RISK_LEVEL_LABEL: Record<AuroraRiskLevel, string> = {
  RIESGO_BAJO: "riesgo bajo",
  RIESGO_CONTROLADO: "riesgo controlado",
  RIESGO_CRITICO: "riesgo crítico",
};

export const DEFAULT_DECISION_REQUEST: AuroraDecisionRequest = {
  capital: 50000,
  absorption: "restricted",
  reversibility: "partial",
  protocol: "vΩ",
};

export const DEFAULT_DECISION_INPUT: DecisionInput = {
  amount: 50000,
  cash_30d: "MEDIA",
  nature: "UNICO",
  category: "Evaluacion de inversion",
  reversibility: "MEDIA",
  industry: "General",
};

export const HOME_PROOF_REQUEST: AuroraDecisionRequest = {
  capital: 50000,
  absorption: "restricted",
  reversibility: "partial",
  protocol: "vΩ",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function coerceNumber(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeAbsorption(value: unknown): AuroraDecisionAbsorption {
  return value === "yes" || value === "restricted" || value === "no"
    ? value
    : DEFAULT_DECISION_REQUEST.absorption;
}

function normalizeLegacyReversibility(value: unknown): AuroraDecisionReversibility {
  return value === "full" || value === "partial" || value === "none"
    ? value
    : DEFAULT_DECISION_REQUEST.reversibility;
}

function normalizeProtocol(value: unknown): AuroraDecisionProtocol {
  return value === "vΩ" ? value : DEFAULT_DECISION_REQUEST.protocol;
}

function normalizeCash30d(value: unknown): DecisionCash30d {
  return value === "BAJA" || value === "MEDIA" || value === "ALTA"
    ? value
    : DEFAULT_DECISION_INPUT.cash_30d;
}

function normalizeNature(value: unknown): DecisionNature {
  return value === "UNICO" || value === "RECURRENTE"
    ? value
    : DEFAULT_DECISION_INPUT.nature;
}

function normalizeCanonReversibility(value: unknown): DecisionReversibility {
  return value === "ALTA" || value === "MEDIA" || value === "BAJA"
    ? value
    : DEFAULT_DECISION_INPUT.reversibility;
}

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeRiskLevel(value: unknown): AuroraRiskLevel {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    [
      "RIESGO_CRITICO",
      "CRITICO",
      "ALTO",
      "HIGH",
      "SEVERE",
    ].includes(normalized)
  ) {
    return "RIESGO_CRITICO";
  }

  if (
    [
      "RIESGO_CONTROLADO",
      "CONTROLADO",
      "MEDIO",
      "MODERADO",
      "MEDIUM",
    ].includes(normalized)
  ) {
    return "RIESGO_CONTROLADO";
  }

  if (["RIESGO_BAJO", "BAJO", "LOW"].includes(normalized)) {
    return "RIESGO_BAJO";
  }

  return "RIESGO_BAJO";
}

export function normalizeStructuralLoad(value: unknown): DecisionStructuralLoad | undefined {
  return value === "BAJA" || value === "MEDIA" || value === "ALTA" ? value : undefined;
}

export function mapLegacyRequestToCanon(input: AuroraDecisionRequest): DecisionInput {
  return {
    amount: coerceNumber(input.capital, DEFAULT_DECISION_INPUT.amount),
    cash_30d:
      input.absorption === "yes"
        ? "BAJA"
        : input.absorption === "restricted"
          ? "MEDIA"
          : "ALTA",
    nature: DEFAULT_DECISION_INPUT.nature,
    category: DEFAULT_DECISION_INPUT.category,
    reversibility:
      input.reversibility === "full"
        ? "ALTA"
        : input.reversibility === "partial"
          ? "MEDIA"
          : "BAJA",
    industry: DEFAULT_DECISION_INPUT.industry,
  };
}

export function normalizeDecisionInput(input: unknown): DecisionInput {
  if (!isRecord(input)) {
    return { ...DEFAULT_DECISION_INPUT };
  }

  if ("capital" in input || "absorption" in input || "protocol" in input) {
    return mapLegacyRequestToCanon({
      capital: coerceNumber(input.capital, DEFAULT_DECISION_REQUEST.capital),
      absorption: normalizeAbsorption(input.absorption),
      reversibility: normalizeLegacyReversibility(input.reversibility),
      protocol: normalizeProtocol(input.protocol),
    });
  }

  return {
    amount: coerceNumber(input.amount, DEFAULT_DECISION_INPUT.amount),
    cash_30d: normalizeCash30d(input.cash_30d),
    nature: normalizeNature(input.nature),
    category: normalizeText(input.category, DEFAULT_DECISION_INPUT.category),
    reversibility: normalizeCanonReversibility(input.reversibility),
    industry: normalizeText(input.industry, DEFAULT_DECISION_INPUT.industry ?? "General"),
  };
}
