interface MovementRequest {
  method?: string;
  body?: unknown;
}

interface MovementResponse {
  setHeader(name: string, value: string): void;
  status(code: number): MovementResponse;
  json(body: unknown): void;
}

const ENGINE_PATH = "/api/v1/movement/evaluate";
const REQUEST_TIMEOUT_MS = 6000;
const ABSORPTION_OPTIONS = new Set(["yes", "restricted", "no"]);
const REVERSIBILITY_OPTIONS = new Set(["full", "partial", "none"]);

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function resolveEngineUrl(): string | null {
  const origin = String(
    process.env.AURORA_OS_BASE_URL ??
      process.env.AURORA_ENGINE_ORIGIN ??
      process.env.AURORA_ENGINE_BASE_URL ??
      "",
  ).trim();

  if (!origin) {
    return null;
  }

  return new URL(ENGINE_PATH, origin.endsWith("/") ? origin : `${origin}/`).toString();
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === "string") {
    try {
      return readObject(JSON.parse(body));
    } catch {
      return null;
    }
  }

  return readObject(body);
}

function normalizeRequest(body: Record<string, unknown>) {
  const capital = body.capital;
  const absorption = body.absorption;
  const reversibility = body.reversibility;
  const protocol = body.protocol ?? "vΩ";

  if (
    typeof capital !== "number" ||
    !Number.isFinite(capital) ||
    capital < 0 ||
    typeof absorption !== "string" ||
    !ABSORPTION_OPTIONS.has(absorption) ||
    typeof reversibility !== "string" ||
    !REVERSIBILITY_OPTIONS.has(reversibility) ||
    protocol !== "vΩ"
  ) {
    return null;
  }

  return {
    capital,
    absorption,
    reversibility,
    protocol: "vΩ" as const,
  };
}

export default async function handler(req: MovementRequest, res: MovementResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ message: "method not allowed" });
    return;
  }

  const engineUrl = resolveEngineUrl();
  const apiKey = String(process.env.AURORA_API_KEY ?? "").trim();
  const body = parseBody(req.body);

  if (!body) {
    res.status(400).json({ message: "invalid json body" });
    return;
  }

  const request = normalizeRequest(body);

  if (!request) {
    res.status(400).json({ message: "invalid movement request" });
    return;
  }

  if (!engineUrl || !apiKey) {
    res.status(500).json({ message: "movement relay not configured" });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(engineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const rawBody = await upstream.text();

    try {
      const payload = JSON.parse(rawBody);
      res.status(upstream.status).json(payload);
      return;
    } catch {
      res.status(500).json({ message: "invalid upstream response" });
      return;
    }
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";

    res.status(500).json({
      message: isTimeout ? `upstream timeout after ${REQUEST_TIMEOUT_MS}ms` : "movement relay request failed",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
