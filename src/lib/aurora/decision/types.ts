export const DECISION_ABSORPTION_OPTIONS = ["yes", "restricted", "no"] as const;
export const DECISION_REVERSIBILITY_OPTIONS = ["full", "partial", "none"] as const;
export const DECISION_PROTOCOL_OPTIONS = ["vΩ"] as const;
export const DECISION_RISK_LEVEL_OPTIONS = ["BAJO", "CONTROLADO", "CRITICO"] as const;

export type AuroraDecisionAbsorption = (typeof DECISION_ABSORPTION_OPTIONS)[number];
export type AuroraDecisionReversibility = (typeof DECISION_REVERSIBILITY_OPTIONS)[number];
export type AuroraDecisionProtocol = (typeof DECISION_PROTOCOL_OPTIONS)[number];
export type AuroraDecisionRiskLevel = (typeof DECISION_RISK_LEVEL_OPTIONS)[number];

export interface AuroraDecisionRequest {
  capital: number;
  absorption: AuroraDecisionAbsorption;
  reversibility: AuroraDecisionReversibility;
  protocol: AuroraDecisionProtocol;
}

export interface AuroraDecisionResponse {
  risk_level: AuroraDecisionRiskLevel;
  insight: string;
  counterfactual: string;
  decision_id: string;
  decision_hash: string;
}

export interface AuroraDecisionEnvelope {
  data: AuroraDecisionResponse;
  source: "remote";
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

export const DECISION_RISK_LEVEL_LABEL: Record<AuroraDecisionRiskLevel, string> = {
  BAJO: "riesgo bajo",
  CONTROLADO: "riesgo controlado",
  CRITICO: "riesgo crítico",
};

export const DEFAULT_DECISION_REQUEST: AuroraDecisionRequest = {
  capital: 50000,
  absorption: "restricted",
  reversibility: "partial",
  protocol: "vΩ",
};

export const HOME_PROOF_REQUEST: AuroraDecisionRequest = {
  capital: 50000,
  absorption: "restricted",
  reversibility: "partial",
  protocol: "vΩ",
};
