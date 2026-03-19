import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const REQUIRED_AURORA_ENV = [
  "AURORA_OS_BASE_URL",
  "AURORA_API_KEY",
  "AURORA_API_SECRET",
] as const;

export type RequiredAuroraEnv = (typeof REQUIRED_AURORA_ENV)[number];

type EnvRecord = Partial<Record<RequiredAuroraEnv, string>>;

let envLocalCache: EnvRecord | null = null;

function getEnvLocalPath(): string {
  return path.join(process.cwd(), ".env.local");
}

function parseEnvFile(contents: string): EnvRecord {
  const values: EnvRecord = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice("export ".length).trim() : line;
    const separatorIndex = normalized.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim() as RequiredAuroraEnv;
    let value = normalized.slice(separatorIndex + 1).trim();

    if (!REQUIRED_AURORA_ENV.includes(key)) {
      continue;
    }

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value) {
      values[key] = value;
    }
  }

  return values;
}

export function loadEnvLocal(): { envLocalPath: string; exists: boolean; values: EnvRecord } {
  if (envLocalCache !== null) {
    return {
      envLocalPath: getEnvLocalPath(),
      exists: existsSync(getEnvLocalPath()),
      values: envLocalCache,
    };
  }

  const envLocalPath = getEnvLocalPath();

  if (!existsSync(envLocalPath)) {
    envLocalCache = {};
    return {
      envLocalPath,
      exists: false,
      values: envLocalCache,
    };
  }

  envLocalCache = parseEnvFile(readFileSync(envLocalPath, "utf8"));

  return {
    envLocalPath,
    exists: true,
    values: envLocalCache,
  };
}

export function readRequiredAuroraEnv(options?: {
  requireEnvLocal?: boolean;
}): Record<RequiredAuroraEnv, string> {
  const { envLocalPath, exists, values } = loadEnvLocal();
  const resolved = {} as Record<RequiredAuroraEnv, string>;
  const missing: RequiredAuroraEnv[] = [];
  const hasProcessEnvForAll = REQUIRED_AURORA_ENV.every((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (options?.requireEnvLocal && !exists && !hasProcessEnvForAll) {
    throw new Error(
      `Missing .env.local at ${envLocalPath}. Copy .env.example to .env.local and set ${REQUIRED_AURORA_ENV.join(", ")}.`
    );
  }

  for (const name of REQUIRED_AURORA_ENV) {
    const value = process.env[name]?.trim() || values[name]?.trim();

    if (!value) {
      missing.push(name);
      continue;
    }

    process.env[name] = value;
    resolved[name] = value;
  }

  if (missing.length > 0) {
    const suffix = exists
      ? `Add them to ${envLocalPath}.`
      : `Create ${envLocalPath} from .env.example and set them there, or provide them in the runtime environment.`;
    throw new Error(`Missing required Aurora env vars: ${missing.join(", ")}. ${suffix}`);
  }

  return resolved;
}

export function normalizeAuroraBaseUrl(rawBaseUrl: string): string {
  let url: URL;

  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new Error(`Invalid AURORA_OS_BASE_URL: ${rawBaseUrl}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Invalid AURORA_OS_BASE_URL protocol: ${url.protocol}`);
  }

  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }

  url.pathname = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}
