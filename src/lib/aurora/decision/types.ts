export const DECISION_ABSORPTION_OPTIONS = ["yes", "restricted", "no"] as const;
export const DECISION_REVERSIBILITY_OPTIONS = ["full", "partial", "none"] as const;
export const DECISION_PROTOCOL_OPTIONS = ["vΩ"] as const;
export const DECISION_STRUCTURAL_LOAD_OPTIONS = ["contained", "active", "elevated"] as const;
export const DECISION_SYSTEM_PRIMARY_OPTIONS = ["capacity maintained", "capacity compressed"] as const;
export const DECISION_SYSTEM_SECONDARY_OPTIONS = ["execution window open", "execution window narrow"] as const;

export type AuroraDecisionAbsorption = (typeof DECISION_ABSORPTION_OPTIONS)[number];
export type AuroraDecisionReversibility = (typeof DECISION_REVERSIBILITY_OPTIONS)[number];
export type AuroraDecisionProtocol = (typeof DECISION_PROTOCOL_OPTIONS)[number];
export type AuroraDecisionStructuralLoad = (typeof DECISION_STRUCTURAL_LOAD_OPTIONS)[number];
export type AuroraDecisionSystemPrimary = (typeof DECISION_SYSTEM_PRIMARY_OPTIONS)[number];
export type AuroraDecisionSystemSecondary = (typeof DECISION_SYSTEM_SECONDARY_OPTIONS)[number];

export interface AuroraDecisionRequest {
  capital: number;
  absorption: AuroraDecisionAbsorption;
  reversibility: AuroraDecisionReversibility;
  protocol: AuroraDecisionProtocol;
}

export interface AuroraDecisionSystemReading {
  primary: AuroraDecisionSystemPrimary;
  secondary: AuroraDecisionSystemSecondary;
}

export interface AuroraDecisionResponse {
  decision_id: string;
  run_signature: string;
  protocol: AuroraDecisionProtocol;
  pressure_score: number;
  pressure_day: number;
  correction_window_days?: number;
  structural_load: AuroraDecisionStructuralLoad;
  compression_mechanism: string;
  system_reading: AuroraDecisionSystemReading;
  timestamp: string;
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

export const DECISION_STRUCTURAL_LOAD_LABEL: Record<AuroraDecisionStructuralLoad, string> = {
  contained: "contained",
  active: "active",
  elevated: "elevated",
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
