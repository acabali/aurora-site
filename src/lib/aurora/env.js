import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const REQUIRED_AURORA_ENV = [
  "AURORA_OS_BASE_URL",
  "AURORA_API_KEY",
  "AURORA_API_SECRET",
];

const PLACEHOLDER_BASE_URL_SNIPPETS = [
  "placeholder",
  "changeme",
  "replace-me",
  "replace_this",
  "your-backend",
  "your_backend",
  "todo",
  "set-me",
  "example.com",
  "example.org",
  "example.net",
];

let envLocalCache = null;

function getEnvLocalPath() {
  return path.join(process.cwd(), ".env.local");
}

function parseEnvFile(contents) {
  const values = {};

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

    const key = normalized.slice(0, separatorIndex).trim();
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

export function loadEnvLocal() {
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

export function normalizeAuroraBaseUrl(rawBaseUrl) {
  let url;

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

export function isTryCloudflareUrl(rawBaseUrl) {
  try {
    return new URL(normalizeAuroraBaseUrl(rawBaseUrl)).hostname.endsWith(".trycloudflare.com");
  } catch {
    return false;
  }
}

function looksLikePlaceholderBaseUrl(rawBaseUrl) {
  const normalized = rawBaseUrl.trim().toLowerCase();
  return PLACEHOLDER_BASE_URL_SNIPPETS.some((token) => normalized.includes(token));
}

export function validateAuroraBaseUrl(rawBaseUrl) {
  const normalizedBaseUrl = normalizeAuroraBaseUrl(rawBaseUrl);
  const url = new URL(normalizedBaseUrl);

  if (url.hostname === "0.0.0.0") {
    throw new Error(
      "Invalid AURORA_OS_BASE_URL: use http://127.0.0.1:8787 for local Aurora OS, not 0.0.0.0."
    );
  }

  if (isTryCloudflareUrl(normalizedBaseUrl)) {
    throw new Error(
      "Invalid AURORA_OS_BASE_URL: trycloudflare quick tunnels are ephemeral. Use http://127.0.0.1:8787 locally or a persistent production Aurora OS host."
    );
  }

  if (looksLikePlaceholderBaseUrl(normalizedBaseUrl)) {
    throw new Error(
      "Invalid AURORA_OS_BASE_URL: placeholder values are not allowed. Use http://127.0.0.1:8787 locally or a persistent production Aurora OS host."
    );
  }

  return normalizedBaseUrl;
}
