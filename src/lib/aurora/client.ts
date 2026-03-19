import { normalizeAuroraBaseUrl, readRequiredAuroraEnv } from "./env.ts";

export interface AuroraDecisionPayload {
  title: string;
  decision_type: string;
  spend_amount: number;
  revenue_context: string;
  reversibility: "low" | "medium" | "high";
  time_horizon: string;
  expected_upside: string;
  key_constraint: string;
  notes?: string;
}

export class AuroraApiError extends Error {
  status?: number;
  url: string;
  bodySnippet?: string;

  constructor(
    message: string,
    options: { url: string; status?: number; bodySnippet?: string }
  ) {
    super(message);
    this.name = "AuroraApiError";
    this.url = options.url;
    this.status = options.status;
    this.bodySnippet = options.bodySnippet;
  }
}

type RequiredAuroraEnv = "AURORA_OS_BASE_URL" | "AURORA_API_KEY" | "AURORA_API_SECRET";

function requireEnv(name: RequiredAuroraEnv): string {
  const value = readRequiredAuroraEnv()[name];
  if (!value) {
    throw new AuroraApiError(`Missing required environment variable ${name}`, {
      url: "env://local",
    });
  }

  process.env[name] = value;
  return value;
}

function getAuroraBaseUrl(): string {
  return normalizeAuroraBaseUrl(requireEnv("AURORA_OS_BASE_URL"));
}

function buildAuroraUrl(pathname: string): string {
  return new URL(pathname, `${getAuroraBaseUrl()}/`).toString();
}

function toBodySnippet(bodyText: string): string | undefined {
  const normalized = bodyText.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, 220) : undefined;
}

function isHtmlResponse(contentType: string, bodyText: string): boolean {
  return /text\/html/i.test(contentType) || /^\s*<!doctype html|^\s*<html/i.test(bodyText);
}

function buildAuroraFailureMessage(
  pathname: string,
  status: number,
  authHeaderName: "x-api-key" | "x-aurora-secret"
): string {
  if (status === 401 || status === 403) {
    const hint =
      authHeaderName === "x-api-key"
        ? "Verify AURORA_API_KEY / x-api-key."
        : "Verify AURORA_API_SECRET / x-aurora-secret.";

    return `Aurora API authentication failed for ${pathname}. ${hint}`;
  }

  if (status === 404) {
    return `Aurora API endpoint not found for ${pathname}.`;
  }

  return `Aurora API request failed for ${pathname} with status ${status}.`;
}

async function requestAuroraJson<T>(
  pathname: string,
  init: RequestInit & { authHeaderName: "x-api-key" | "x-aurora-secret"; authHeaderValue: string }
): Promise<T> {
  const url = buildAuroraUrl(pathname);
  const headers = new Headers(init.headers);

  headers.set("accept", "application/json");
  headers.set(init.authHeaderName, init.authHeaderValue);

  if (init.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new AuroraApiError(
      `Aurora API network failure for ${pathname}. Verify AURORA_OS_BASE_URL points to the live Aurora OS backend and the service is reachable.`,
      {
      url,
      bodySnippet: error instanceof Error ? error.message : String(error),
      }
    );
  }

  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (isHtmlResponse(contentType, bodyText)) {
    throw new AuroraApiError(`Aurora API returned HTML for ${pathname}`, {
      url,
      status: response.status,
      bodySnippet: toBodySnippet(bodyText),
    });
  }

  if (response.status !== 200) {
    throw new AuroraApiError(
      buildAuroraFailureMessage(pathname, response.status, init.authHeaderName),
      {
      url,
      status: response.status,
      bodySnippet: toBodySnippet(bodyText),
      }
    );
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new AuroraApiError(`Aurora API returned non-JSON content for ${pathname}`, {
      url,
      status: response.status,
      bodySnippet: toBodySnippet(bodyText),
    });
  }
}

export async function getSystemState<T = Record<string, unknown>>(): Promise<T> {
  return requestAuroraJson<T>("/api/system-state", {
    method: "GET",
    authHeaderName: "x-aurora-secret",
    authHeaderValue: requireEnv("AURORA_API_SECRET"),
  });
}

export async function postDecision<T = Record<string, unknown>>(
  payload: AuroraDecisionPayload
): Promise<T> {
  return requestAuroraJson<T>("/api/decision", {
    method: "POST",
    body: JSON.stringify(payload),
    authHeaderName: "x-api-key",
    authHeaderValue: requireEnv("AURORA_API_KEY"),
  });
}
