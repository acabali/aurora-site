import type {
  AuroraDecisionEnvelope,
  AuroraDecisionErrorShape,
  AuroraDecisionRequest,
  AuroraDecisionResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 6000;
const DECISION_ENDPOINT = "/api/v1/movement/evaluate";

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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= min && value <= max;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeResponse(payload: unknown): AuroraDecisionResponse {
  const root = readObject(payload);
  const systemReading = readObject(root?.system_reading);

  if (
    typeof root?.decision_id !== "string" ||
    !/^AUR-[A-Z0-9]{4,}$/i.test(root.decision_id) ||
    typeof root?.run_signature !== "string" ||
    !/^[a-f0-9]{6}$/.test(root.run_signature) ||
    root?.protocol !== "vΩ" ||
    !isFiniteNumber(root?.pressure_score) ||
    root.pressure_score < 0 ||
    root.pressure_score > 1 ||
    !isIntegerInRange(root?.pressure_day, 21, 45) ||
    (root?.correction_window_days !== undefined &&
      !isIntegerInRange(root.correction_window_days, 0, 24)) ||
    (root?.structural_load !== "contained" &&
      root?.structural_load !== "active" &&
      root?.structural_load !== "elevated") ||
    typeof root?.compression_mechanism !== "string" ||
    root.compression_mechanism.trim().length === 0 ||
    !systemReading ||
    (systemReading.primary !== "capacity maintained" &&
      systemReading.primary !== "capacity compressed") ||
    (systemReading.secondary !== "execution window open" &&
      systemReading.secondary !== "execution window narrow") ||
    !isIsoTimestamp(root?.timestamp)
  ) {
    throw new AuroraDecisionAdapterError({
      code: "unknown",
      message: "Aurora devolvio un contrato invalido.",
      retriable: false,
    });
  }

  return {
    decision_id: root.decision_id,
    run_signature: root.run_signature,
    protocol: root.protocol,
    pressure_score: root.pressure_score,
    pressure_day: root.pressure_day,
    correction_window_days: root.correction_window_days,
    structural_load: root.structural_load,
    compression_mechanism: root.compression_mechanism,
    system_reading: {
      primary: systemReading.primary,
      secondary: systemReading.secondary,
    },
    timestamp: root.timestamp,
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
      message: errorMessageFromPayload(payload, "Aurora rechazo la autenticación del relay."),
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
    message: errorMessageFromPayload(payload, `Aurora devolvio un estado no esperado (${status}).`),
    retriable: status >= 502,
    status,
  });
}

async function fetchRemoteDecision(request: AuroraDecisionRequest): Promise<AuroraDecisionResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DECISION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
        ? `Aurora excedio el timeout de ${REQUEST_TIMEOUT_MS}ms.`
        : "No fue posible conectar con Aurora.",
      retriable: true,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function submitAuroraDecision(request: AuroraDecisionRequest): Promise<AuroraDecisionEnvelope> {
  const result = await fetchRemoteDecision(request);

  return {
    data: result,
    source: "remote",
  };
}

export function toAuroraDecisionError(error: unknown): AuroraDecisionAdapterError {
  if (error instanceof AuroraDecisionAdapterError) {
    return error;
  }

  return new AuroraDecisionAdapterError({
    code: "unknown",
    message: "Aurora no devolvio una respuesta utilizable.",
    retriable: false,
  });
}
