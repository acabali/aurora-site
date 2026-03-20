import { readRequiredAuroraEnv } from "../src/lib/aurora/env.ts";

function assertJsonObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} did not return a JSON object`);
  }
}

function getNestedRecord(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function collectScopes(root: Record<string, unknown>): Record<string, unknown>[] {
  const scopes: Record<string, unknown>[] = [];
  const queue: Record<string, unknown>[] = [root];
  const visited = new Set<Record<string, unknown>>();

  while (queue.length > 0 && scopes.length < 48) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);
    scopes.push(current);

    for (const value of Object.values(current)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        queue.push(value as Record<string, unknown>);
      }
    }
  }

  return scopes;
}

function findString(scopes: Record<string, unknown>[], keys: string[]): string | null {
  for (const scope of scopes) {
    for (const key of keys) {
      const value = scope[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}

function findBoolean(scopes: Record<string, unknown>[], keys: string[]): boolean | null {
  for (const scope of scopes) {
    for (const key of keys) {
      const value = scope[key];
      if (typeof value === "boolean") {
        return value;
      }
    }
  }

  return null;
}

function findNumber(scopes: Record<string, unknown>[], keys: string[]): number | null {
  for (const scope of scopes) {
    for (const key of keys) {
      const value = scope[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

function assertHealthySuccess(value: Record<string, unknown>, label: string): void {
  if (value.ok === true || value.success === true) {
    return;
  }

  throw new Error(`${label} did not report ok=true or success=true`);
}

function assertNoUpstreamError(value: Record<string, unknown>, label: string): void {
  const scopes = collectScopes(value);

  for (const scope of scopes) {
    const upstreamStatus = scope.upstreamStatus;
    const upstreamError = scope.upstreamError;

    if (typeof upstreamStatus === "number" && upstreamStatus >= 400) {
      throw new Error(`${label} reported upstreamStatus=${upstreamStatus}`);
    }

    if (typeof upstreamError === "string" && upstreamError.trim()) {
      throw new Error(`${label} reported upstreamError=${upstreamError}`);
    }
  }

  if (typeof value.error === "string" && value.error.trim() && value.ok !== true && value.success !== true) {
    throw new Error(`${label} reported error=${value.error}`);
  }
}

function assertNoHtmlOrMock(value: Record<string, unknown>, label: string): void {
  const serialized = JSON.stringify(value).toLowerCase();

  if (serialized.includes("<html") || serialized.includes("<!doctype html")) {
    throw new Error(`${label} returned HTML unexpectedly`);
  }

  if (serialized.includes("mock")) {
    throw new Error(`${label} returned a mock marker`);
  }
}

function assertSystemStateContract(systemState: Record<string, unknown>): void {
  assertNoHtmlOrMock(systemState, "system-state");
  assertHealthySuccess(systemState, "system-state");
  assertNoUpstreamError(systemState, "system-state");

  const data = getNestedRecord(systemState, "data");
  if (!data) {
    throw new Error("system-state is missing data");
  }

  const config = getNestedRecord(data, "config");
  if (!config) {
    throw new Error("system-state is missing data.config");
  }

  const runtime = getNestedRecord(data, "runtime");
  const runtimeConfig = runtime ? getNestedRecord(runtime, "config") : null;
  const allowedProviders = new Set(["openai", "claude", "openrouter", "gemini"]);

  for (const [label, value] of [
    ["config.defaultProvider", findString([config], ["defaultProvider"])],
    ["config.agentBackend", findString([config], ["agentBackend"])],
    ["config.embeddingProvider", findString([config], ["embeddingProvider"])],
    [
      "runtime.config.defaultProvider",
      runtimeConfig ? findString([runtimeConfig], ["defaultProvider"]) : null,
    ],
    [
      "runtime.config.agentBackend",
      runtimeConfig ? findString([runtimeConfig], ["agentBackend"]) : null,
    ],
  ] as const) {
    if (!value || !allowedProviders.has(value)) {
      throw new Error(`${label} is not a real provider`);
    }
  }

  const configPort = findNumber([config], ["port"]);
  const runtimePort = runtimeConfig ? findNumber([runtimeConfig], ["port"]) : null;

  const baseUrl = process.env.AURORA_OS_BASE_URL ?? "";
  const isLocal =
    baseUrl.includes("127.0.0.1") || baseUrl.includes("localhost");
  if (isLocal && (configPort !== 8787 || runtimePort !== 8787)) {
    throw new Error(
      `system-state reported port ${configPort ?? "unknown"} / ${runtimePort ?? "unknown"}, expected 8787 for local`
    );
  }

  console.log(
    `SYSTEM_STATE_OK port=${configPort} defaultProvider=${findString([config], ["defaultProvider"])}`
  );
}

function assertDecisionContract(decision: Record<string, unknown>): void {
  assertNoHtmlOrMock(decision, "decision");
  assertHealthySuccess(decision, "decision");
  assertNoUpstreamError(decision, "decision");

  const scopes = collectScopes(decision);
  const provider = findString(scopes, [
    "provider",
    "resolvedProvider",
    "requestedProvider",
    "defaultProvider",
    "agentBackend",
  ]);
  const resolvedProvider = findString(scopes, ["resolvedProvider", "provider", "defaultProvider"]);
  const model = findString(scopes, ["model", "resolvedModel"]);
  const protocolVersion = findString(scopes, [
    "protocol_version",
    "protocolVersion",
    "protocol",
    "version",
  ]);
  const decisionId = findString(scopes, ["decision_id", "decisionId", "id"]);

  if (!provider) {
    throw new Error("decision is missing provider");
  }

  if (!resolvedProvider) {
    throw new Error("decision is missing resolvedProvider");
  }

  if (!model) {
    throw new Error("decision is missing model");
  }

  if (!protocolVersion) {
    throw new Error("decision is missing protocol_version");
  }

  if (!decisionId) {
    throw new Error("decision is missing decision_id");
  }

  if (findBoolean(scopes, ["fallbackUsed"]) !== false) {
    throw new Error("decision fallbackUsed is not false");
  }

  console.log(
    `DECISION_OK provider=${provider} resolvedProvider=${resolvedProvider} model=${model}`
  );
}

async function main(): Promise<void> {
  readRequiredAuroraEnv({ requireEnvLocal: true });
  const { getSystemState, postDecision } = await import("../src/lib/aurora/client.ts");

  const systemState = await getSystemState();
  assertJsonObject(systemState, "system-state");
  assertSystemStateContract(systemState);

  const decision = await postDecision({
    title: "Market absorbs the movement with bounded resistance for a USD 50,000 commitment",
    decision_type: "bounded_allocation",
    spend_amount: 50000,
    revenue_context:
      "The surrounding market can absorb the movement without immediate structural spillover. Committed capital: USD 50,000.",
    reversibility: "high",
    time_horizon: "6 weeks",
    expected_upside:
      "Validate demand under controlled exposure while preserving execution capacity.",
    key_constraint:
      "Do not mistake apparent absorption for durable slack once capital is committed.",
    notes: "aurora-site smoke relay canonical payload",
  });
  assertJsonObject(decision, "decision");
  assertDecisionContract(decision);
  console.log("SMOKE_API_OK=1");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
