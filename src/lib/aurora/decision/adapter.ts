import { evaluateMovement } from "./movementEngine";
import type {
  AuroraDecisionEnvelope,
  AuroraDecisionErrorShape,
  AuroraDecisionRequest,
  AuroraDecisionResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 12000;

export class AuroraDecisionAdapterError extends Error {
  readonly code: AuroraDecisionErrorShape["code"];
  readonly retriable: boolean;
  readonly status?: number;

  constructor(shape: AuroraDecisionErrorShape) {
    super(shape.message);
    this.name = "AuroraDecisionAdapterError";
    this.code = shape.code;
    this.retriable = shape.retriable;
    this.status = shape.status;
  }

  toJSON(): AuroraDecisionErrorShape {
    return {
      code: this.code,
      message: this.message,
      retriable: this.retriable,
      status: this.status,
    };
  }
}

function getEndpoint(): string {
  return String(import.meta.env.PUBLIC_AURORA_DECISION_ENDPOINT ?? "").trim();
}

function allowFallback(): boolean {
  return (
    import.meta.env.DEV ||
    import.meta.env.PUBLIC_AURORA_DECISION_FALLBACK === "local" ||
    getEndpoint().length === 0
  );
}

function normalizeRiskLevel(value: unknown): AuroraDecisionResponse["riskLevel"] | null {
  if (value === "RIESGO_BAJO" || value === "RIESGO_CONTROLADO" || value === "RIESGO_CRITICO") {
    return value;
  }

  return null;
}

function normalizeEvidence(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeResponse(payload: unknown): AuroraDecisionResponse {
  const root = readObject(payload);
  const candidate =
    readObject(root?.data) ??
    readObject(root?.canonical) ??
    root;

  const riskLevel = normalizeRiskLevel(candidate?.riskLevel ?? candidate?.risk_level ?? candidate?.status);
  const insight = candidate?.insight ?? candidate?.explanation ?? candidate?.executive_summary;
  const counterfactual = candidate?.counterfactual;
  const decisionId = candidate?.decisionId ?? candidate?.decision_id;
  const decisionHash = candidate?.decisionHash ?? candidate?.decision_hash;
  const evidence = normalizeEvidence(candidate?.evidence ?? candidate?.evidenceUsed);

  if (
    !riskLevel ||
    typeof insight !== "string" ||
    typeof counterfactual !== "string" ||
    typeof decisionId !== "string" ||
    typeof decisionHash !== "string"
  ) {
    throw new AuroraDecisionAdapterError({
      code: "BAD_RESPONSE",
      message: "Aurora no devolvio un contrato de decision valido.",
      retriable: false,
    });
  }

  return {
    riskLevel,
    insight,
    counterfactual,
    decisionId,
    decisionHash,
    evidence,
  };
}

function buildServiceError(status: number, payload: unknown): AuroraDecisionAdapterError {
  const candidate = readObject(payload);
  const message =
    typeof candidate?.message === "string"
      ? candidate.message
      : typeof candidate?.error === "string"
        ? candidate.error
        : `Aurora devolvio un error ${status}.`;

  return new AuroraDecisionAdapterError({
    code: "SERVICE_ERROR",
    message,
    retriable: status >= 500,
    status,
  });
}

function buildConfigurationError(): AuroraDecisionAdapterError {
  return new AuroraDecisionAdapterError({
    code: "CONFIGURATION_ERROR",
    message: "El endpoint de decision no esta configurado.",
    retriable: false,
  });
}

function toDecisionEnvelope(data: AuroraDecisionResponse, source: AuroraDecisionEnvelope["source"]): AuroraDecisionEnvelope {
  return { data, source };
}

async function fetchRemoteDecision(request: AuroraDecisionRequest): Promise<AuroraDecisionResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        currency: request.currency ?? "USD",
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw buildServiceError(response.status, payload);
    }

    return normalizeResponse(payload);
  } catch (error) {
    if (error instanceof AuroraDecisionAdapterError) {
      throw error;
    }

    throw new AuroraDecisionAdapterError({
      code: "NETWORK_ERROR",
      message: "No fue posible completar la conexion con Aurora.",
      retriable: true,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function resolveFallbackDecision(request: AuroraDecisionRequest): AuroraDecisionEnvelope {
  return toDecisionEnvelope(evaluateMovement(request), "fallback");
}

export async function submitAuroraDecision(request: AuroraDecisionRequest): Promise<AuroraDecisionEnvelope> {
  const endpoint = getEndpoint();

  if (!endpoint) {
    if (allowFallback()) {
      return resolveFallbackDecision(request);
    }

    throw buildConfigurationError();
  }

  try {
    const result = await fetchRemoteDecision(request);
    return toDecisionEnvelope(result, "remote");
  } catch (error) {
    if (allowFallback()) {
      return resolveFallbackDecision(request);
    }

    throw toAuroraDecisionError(error);
  }
}

export function toAuroraDecisionError(error: unknown): AuroraDecisionAdapterError {
  if (error instanceof AuroraDecisionAdapterError) {
    return error;
  }

  return new AuroraDecisionAdapterError({
    code: "NETWORK_ERROR",
    message: "No fue posible completar la conexion con Aurora.",
    retriable: true,
  });
}
