import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeAuroraBaseUrl,
  readRequiredAuroraEnv,
  REQUIRED_AURORA_ENV,
} from "../../src/lib/aurora/env.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

function getNodeArgs(scriptPath: string): string[] {
  return ["--experimental-strip-types", path.join(repoRoot, scriptPath)];
}

function getPackageManagerArgs(scriptName: string): [string, string[]] {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("pnpm/")) {
    return ["pnpm", ["run", scriptName]];
  }

  if (userAgent.startsWith("yarn/")) {
    return ["yarn", [scriptName]];
  }

  return ["npm", ["run", scriptName]];
}

async function runCommand(
  label: string,
  command: string,
  args: string[],
  options?: { longRunning?: boolean }
): Promise<void> {
  console.log(`\n[repo] ${label}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${label} terminated by signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${label} failed with exit code ${code ?? "unknown"}`));
        return;
      }

      resolve();
    });
  });

  if (!options?.longRunning) {
    console.log(`[repo] ${label} OK`);
  }
}

function isHtmlResponse(contentType: string, bodyText: string): boolean {
  return /text\/html/i.test(contentType) || /^\s*<!doctype html|^\s*<html/i.test(bodyText);
}

function toSnippet(bodyText: string): string {
  return bodyText.trim().replace(/\s+/g, " ").slice(0, 220);
}

function isHealthySuccess(payload: Record<string, unknown>): boolean {
  return payload.ok === true || payload.success === true;
}

export function validateAuroraEnv(): Record<(typeof REQUIRED_AURORA_ENV)[number], string> {
  const env = readRequiredAuroraEnv({ requireEnvLocal: true });
  console.log(`[repo] env OK: ${REQUIRED_AURORA_ENV.join(", ")}`);
  return env;
}

export async function validateAuroraBackend(): Promise<Record<string, unknown>> {
  const env = readRequiredAuroraEnv({ requireEnvLocal: true });
  const url = new URL("/api/system-state", `${normalizeAuroraBaseUrl(env.AURORA_OS_BASE_URL)}/`).toString();

  console.log(`[repo] backend gate GET ${url}`);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-aurora-secret": env.AURORA_API_SECRET,
      },
    });
  } catch (error) {
    throw new Error(
      `Aurora backend gate failed: network error calling ${url}. ${(error as Error).message}`
    );
  }

  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status !== 200) {
    throw new Error(
      `Aurora backend gate failed: ${url} returned ${response.status}. ${toSnippet(bodyText) || "Empty response."}`
    );
  }

  if (isHtmlResponse(contentType, bodyText)) {
    throw new Error(`Aurora backend gate failed: ${url} returned HTML instead of JSON.`);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new Error(`Aurora backend gate failed: ${url} returned invalid JSON.`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Aurora backend gate failed: ${url} did not return a JSON object.`);
  }

  if (!isHealthySuccess(payload as Record<string, unknown>)) {
    throw new Error(
      `Aurora backend gate failed: ${url} did not report ok=true or success=true.`
    );
  }

  console.log("[repo] backend gate OK");
  return payload as Record<string, unknown>;
}

export async function runSiteDev(): Promise<void> {
  await runCommand("start site dev server", process.execPath, [path.join(repoRoot, "tools/dev.mjs")], {
    longRunning: true,
  });
}

export async function runRepoSmoke(): Promise<void> {
  await runCommand("run canonical smoke", process.execPath, getNodeArgs("scripts/smoke-aurora-os.ts"));
}

export async function runSiteBuild(): Promise<void> {
  const [command, args] = getPackageManagerArgs("site:build");
  await runCommand("build site", command, args);
}
