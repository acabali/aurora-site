type DecisionInput = {
  amount?: number;
  cash_30d?: string;
  nature?: string;
  category?: string;
  reversibility?: string;
  industry?: string;
};

type DecisionOutput = {
  risk_level: string;
  insight: string;
  counterfactual: string;
  decision_id: string;
  decision_hash: string;
  pressure_score?: number;
  pressure_day?: number;
  structural_load?: string;
};

function stableHash(input: unknown): string {
  const str = typeof input === "string" ? input : JSON.stringify(input, Object.keys(input as object).sort());
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0")).slice(0, 16);
}

function normalizeRiskLevel(value: unknown): string {
  const v = String(value || "").toUpperCase().trim();
  if (["CRITICO", "CRÍTICO", "HIGH", "ALTO", "RIESGO_CRITICO", "RIESGO_CRÍTICO"].includes(v)) return "RIESGO_CRITICO";
  if (["CONTROLADO", "MEDIO", "MODERADO", "MEDIUM", "RIESGO_CONTROLADO"].includes(v)) return "RIESGO_CONTROLADO";
  return "RIESGO_BAJO";
}

function normalizeClaudePayload(raw: any, input: DecisionInput): DecisionOutput {
  let parsed: any = {};
  try {
    const text = raw?.content?.[0]?.text || raw?.text || JSON.stringify(raw);
    parsed = JSON.parse(text);
  } catch {
    parsed = raw || {};
  }

  const seed = {
    input,
    risk_level: parsed.risk_level ?? parsed.status ?? "RIESGO_BAJO",
    insight: parsed.insight ?? parsed.executive_summary ?? "Análisis realizado por Aurora Decision Core.",
    counterfactual: parsed.counterfactual ?? parsed.alternative ?? "Sin contrafactual generado en esta ejecución.",
    pressure_score: parsed.pressure_score,
    pressure_day: parsed.pressure_day,
    structural_load: parsed.structural_load,
  };

  const decision_hash = stableHash(seed);
  return {
    risk_level: normalizeRiskLevel(seed.risk_level),
    insight: String(seed.insight).trim(),
    counterfactual: String(seed.counterfactual).trim(),
    decision_id: `dec_${decision_hash}`,
    decision_hash,
    pressure_score: typeof seed.pressure_score === "number" ? seed.pressure_score : undefined,
    pressure_day: typeof seed.pressure_day === "number" ? seed.pressure_day : undefined,
    structural_load: seed.structural_load ? String(seed.structural_load) : undefined,
  };
}

export async function getClaudeDecision(input: DecisionInput): Promise<DecisionOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in environment");

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const system = `You are Aurora Decision Core, an expert risk-assessment system.
Return **ONLY** valid JSON with no extra text, no markdown, no explanations.
Required keys: risk_level, insight, counterfactual
Optional keys: pressure_score (number 0-100), pressure_day (number), structural_load (string)
risk_level must be exactly one of: RIESGO_BAJO, RIESGO_CONTROLADO, RIESGO_CRITICO`;

  const userMessage = {
    task: "Evaluate the following business decision and return Aurora structured JSON only.",
    input,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31" // opcional, mejora rendimiento
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.0,
      system,
      messages: [{ role: "user", content: JSON.stringify(userMessage) }]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const raw = await res.json();
  return normalizeClaudePayload(raw, input);
}
