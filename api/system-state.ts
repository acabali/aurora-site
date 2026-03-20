import { AuroraApiError, getSystemState } from "../src/lib/aurora/client.js";

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const systemState = await getSystemState();
    res.status(200).json(systemState);
  } catch (error) {
    if (error instanceof AuroraApiError) {
      res.status(error.status ?? 502).json({
        success: false,
        error: "AURORA_SYSTEM_STATE_FAILED",
        message: error.message,
        upstreamStatus: error.status ?? null,
        upstreamUrl: error.url,
        bodySnippet: error.bodySnippet ?? null,
        relay: {
          endpoint: "/api/system-state",
          authHeader: "x-aurora-secret",
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "AURORA_SYSTEM_STATE_FAILED",
      message: error instanceof Error ? error.message : "Unknown system state error",
    });
  }
}
