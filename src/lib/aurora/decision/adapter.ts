import type {
  AuroraDecisionEnvelope,
  AuroraDecisionErrorShape,
  AuroraDecisionRequest,
  AuroraDecisionResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 6000;

const DECISION_ENDPOINT =
  import.meta.env.PUBLIC_AURORA_DECISION_ENDPOINT || "/api/decision";

const AURORA_MODE = import.meta.env.PUBLIC_AURORA_MODE || "dev";

const ALLOW_FALLBACK =
  import.meta.env.PUBLIC_AURORA_DECISION_FALLBACK === "local";

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

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeResponse(payload: unknown): AuroraDecisionResponse {
  const root = readObject(payload);

  if (
    (root?.risk_level !== "BAJO" &&
      root?.risk_level !== "CONTROLADO" &&
      root?.risk_level !== "CRITICO") ||
    typeof root?.insight !== "string" ||
    root.insight.trim().length === 0 ||
    typeof root?.counterfactual !== "string" ||
    root.counterfactual.trim().length === 0 ||
    typeof root?.decision_id !== "string" ||
    !/^AUR-[A-Z0-9]{4,}$/i.test(root.decision_id) ||
    typeof root?.decision_hash !== "string" ||
    !/^[a-f0-9]{8}$/i.test(root.decision_hash)
  ) {
    throw new AuroraDecisionAdapterError({
      code: "server",
      message: "Aurora devolvió una respuesta fuera del contrato esperado.",
      retriable: true,
    });
  }

  return {
    risk_level: root.risk_level,
    insight: root.insight,
    counterfactual: root.counterfactual,
    decision_id: root.decision_id,
    decision_hash: root.decision_hash,
  };
}

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  const candidate = readObject(payload);

  if (typeof candidate?.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message;
  }

  if (typeof candidate?.error === "string" && candidate.error.trim().length > 0) {
    return candidate.error;
  }

  return fallback;
}

function buildServiceError(status: number, payload: unknown): AuroraDecisionAdapterError {
  if (status === 400) {
    return new AuroraDecisionAdapterError({
      code: "validation",
      message: errorMessageFromPayload(payload, "El movimiento no cumple el contrato canónico."),
      retriable: false,
      status,
    });
  }

  if (status === 401 || status === 403) {
    return new AuroraDecisionAdapterError({
      code: "auth",
      message: errorMessageFromPayload(payload, "Aurora rechazó la autenticación del relay."),
      retriable: false,
      status,
    });
  }

  if (status === 500) {
    return new AuroraDecisionAdapterError({
      code: "server",
      message: errorMessageFromPayload(payload, "Aurora no pudo completar la evaluación."),
      retriable: true,
      status,
    });
  }

  return new AuroraDecisionAdapterError({
    code: "unknown",
    message: errorMessageFromPayload(
      payload,
      `Aurora devolvió un estado no esperado (${status}).`,
    ),
    retriable: status >= 502,
    status,
  });
}

async function fetchRemoteDecision(
  request: AuroraDecisionRequest,
): Promise<AuroraDecisionResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DECISION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(import.meta.env.AURORA_API_KEY
          ? { Authorization: `Bearer ${import.meta.env.AURORA_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(request),
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

    const isTimeout = error instanceof DOMException && error.name === "AbortError";

    throw new AuroraDecisionAdapterError({
      code: "network",
      message: isTimeout
        ? `Aurora excedió el timeout de ${REQUEST_TIMEOUT_MS}ms.`
        : "No fue posible conectar con Aurora.",
      retriable: true,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function submitAuroraDecision(
  request: AuroraDecisionRequest,
): Promise<AuroraDecisionEnvelope> {
  try {
    const result = await fetchRemoteDecision(request);

    return {
      data: result,
      source: "remote",
    };
  } catch (error) {
    if (AURORA_MODE === "dev" && ALLOW_FALLBACK) {
      const { evaluateMovement } = await import("./movementEngine");
      const fallback = await evaluateMovement(request);

      return {
        data: {
          risk_level: fallback.riskLevel,
          insight: fallback.insight,
          counterfactual: fallback.counterfactual,
          decision_id: fallback.decisionId,
          decision_hash: fallback.decisionHash,
        },
        source: "local",
      };
    }

    throw error;
  }
}

export function toAuroraDecisionError(error: unknown): AuroraDecisionAdapterError {
  if (error instanceof AuroraDecisionAdapterError) {
    return error;
  }

  return new AuroraDecisionAdapterError({
    code: "unknown",
    message: "Aurora no devolvió una respuesta utilizable.",
    retriable: false,
  });
}
