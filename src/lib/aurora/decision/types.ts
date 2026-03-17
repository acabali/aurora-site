export const DECISION_CASH_COMMITMENT_OPTIONS = ["BAJA", "MEDIA", "ALTA"] as const;
export const DECISION_NATURE_OPTIONS = ["UNICO", "RECURRENTE"] as const;
export const DECISION_CATEGORY_OPTIONS = [
  "EQUIPAMIENTO",
  "VENTAS_CANALES",
  "ADQUISICION_PAGA",
] as const;
export const DECISION_REVERSIBILITY_OPTIONS = ["ALTA", "MEDIA", "BAJA"] as const;
export const DECISION_INDUSTRY_OPTIONS = [
  "SERVICIOS",
  "SAAS",
  "ECOMMERCE",
  "MANUFACTURA",
  "RETAIL",
  "LOGISTICA",
  "SALUD",
  "EDUCACION",
  "FINTECH",
  "OTRA",
] as const;
export const DECISION_RISK_LEVELS = [
  "RIESGO_BAJO",
  "RIESGO_CONTROLADO",
  "RIESGO_CRITICO",
] as const;

export type AuroraDecisionCashCommitment = (typeof DECISION_CASH_COMMITMENT_OPTIONS)[number];
export type AuroraDecisionNature = (typeof DECISION_NATURE_OPTIONS)[number];
export type AuroraDecisionCategory = (typeof DECISION_CATEGORY_OPTIONS)[number];
export type AuroraDecisionReversibility = (typeof DECISION_REVERSIBILITY_OPTIONS)[number];
export type AuroraDecisionIndustry = (typeof DECISION_INDUSTRY_OPTIONS)[number];
export type AuroraDecisionRiskLevel = (typeof DECISION_RISK_LEVELS)[number];

export interface AuroraDecisionRequest {
  amount: number;
  currency?: "USD";
  cashCommitment30d: AuroraDecisionCashCommitment;
  nature: AuroraDecisionNature;
  category: AuroraDecisionCategory;
  reversibility: AuroraDecisionReversibility;
  industry: AuroraDecisionIndustry;
}

export interface AuroraDecisionResponse {
  riskLevel: AuroraDecisionRiskLevel;
  insight: string;
  counterfactual: string;
  decisionId: string;
  decisionHash: string;
  evidence: string[];
}

export interface AuroraDecisionEnvelope {
  data: AuroraDecisionResponse;
  source: "remote" | "fallback";
}

export interface AuroraDecisionErrorShape {
  code:
    | "CONFIGURATION_ERROR"
    | "NETWORK_ERROR"
    | "BAD_RESPONSE"
    | "SERVICE_ERROR";
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

export const DECISION_CASH_COMMITMENT_LABEL: Record<AuroraDecisionCashCommitment, string> = {
  BAJA: "Caja comprometida baja",
  MEDIA: "Caja comprometida media",
  ALTA: "Caja comprometida alta",
};

export const DECISION_NATURE_LABEL: Record<AuroraDecisionNature, string> = {
  UNICO: "Movimiento único",
  RECURRENTE: "Movimiento recurrente",
};

export const DECISION_CATEGORY_LABEL: Record<AuroraDecisionCategory, string> = {
  EQUIPAMIENTO: "Equipamiento y estructura",
  VENTAS_CANALES: "Ventas y canales",
  ADQUISICION_PAGA: "Adquisición paga",
};

export const DECISION_REVERSIBILITY_LABEL: Record<AuroraDecisionReversibility, string> = {
  ALTA: "Reversibilidad alta",
  MEDIA: "Reversibilidad media",
  BAJA: "Reversibilidad baja",
};

export const DECISION_INDUSTRY_LABEL: Record<AuroraDecisionIndustry, string> = {
  SERVICIOS: "Servicios",
  SAAS: "SaaS",
  ECOMMERCE: "Ecommerce",
  MANUFACTURA: "Manufactura",
  RETAIL: "Retail",
  LOGISTICA: "Logistica",
  SALUD: "Salud",
  EDUCACION: "Educacion",
  FINTECH: "Fintech",
  OTRA: "Otra industria",
};

export const DECISION_RISK_LEVEL_LABEL: Record<AuroraDecisionRiskLevel, string> = {
  RIESGO_BAJO: "Riesgo bajo",
  RIESGO_CONTROLADO: "Riesgo controlado",
  RIESGO_CRITICO: "Riesgo critico",
};

export const DEFAULT_DECISION_REQUEST: AuroraDecisionRequest = {
  amount: 120000,
  currency: "USD",
  cashCommitment30d: "MEDIA",
  nature: "UNICO",
  category: "VENTAS_CANALES",
  reversibility: "MEDIA",
  industry: "SAAS",
};

export const HOME_PROOF_REQUEST: AuroraDecisionRequest = {
  amount: 180000,
  currency: "USD",
  cashCommitment30d: "MEDIA",
  nature: "RECURRENTE",
  category: "ADQUISICION_PAGA",
  reversibility: "MEDIA",
  industry: "SAAS",
};
