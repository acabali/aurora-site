import type { CritiqueInput, CritiqueOutput } from "../../types.js";

const CRITIQUE_SYSTEM_PROMPT = `You are a ruthless strategic critic for high-stakes decision systems.
Your job is to destroy weak decisions before they cause damage.

You detect and flag:
- Empty jargon masquerading as insight
- Generic plans with no causal specificity
- Internal contradictions between stated goals and proposed actions
- Missing causal chains (correlation claimed as causation)
- Inflated confidence scores not grounded in evidence
- Optimization outputs that ignore tradeoffs
- Benchmark comparisons with no adversarial stress

You output structured JSON only. No preamble. No explanation outside the JSON.

Rules:
- critique_score: 0-100. 100 = bulletproof decision. Below 70 = requires revision.
- generic_output_risk: 0.0-1.0. Above 0.3 = the output could apply to any company.
- executive_confidence: 0-100. How much an experienced executive should trust this.
- recommendation: APPROVE (≥80 critique_score), REVIEW (50-79), REJECT (<50).`;

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

async function callClaude(messages: ClaudeMessage[], systemPrompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const block = data.content.find((b) => b.type === "text");
  if (!block) throw new Error("No text block in Claude response");
  return block.text;
}

function parseJsonResponse<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in critique response");
  return JSON.parse(match[0]) as T;
}

function buildCritiquePrompt(input: CritiqueInput): string {
  return `Analyze this decision package and return a JSON critique.

DECISION CONTEXT:
${JSON.stringify(input.decision_context, null, 2)}

EXECUTION PLAN:
${JSON.stringify(input.execution_plan, null, 2)}

OPTIMIZATION OUTPUT:
${JSON.stringify(input.optimization_output, null, 2)}

BENCHMARK OUTPUT:
${JSON.stringify(input.benchmark_output, null, 2)}

EXECUTIVE SUMMARY:
${input.executive_summary}

Return ONLY this JSON structure:
{
  "critique_score": <number 0-100>,
  "hidden_assumptions": [<string>, ...],
  "strategic_risks": [<string>, ...],
  "weak_reasoning": [<string>, ...],
  "contradiction_flags": [<string>, ...],
  "generic_output_risk": <number 0.0-1.0>,
  "executive_confidence": <number 0-100>,
  "recommendation": "APPROVE" | "REVIEW" | "REJECT"
}`;
}

function deriveRecommendation(score: number): "APPROVE" | "REVIEW" | "REJECT" {
  if (score >= 80) return "APPROVE";
  if (score >= 50) return "REVIEW";
  return "REJECT";
}

function sanitizeOutput(raw: Partial<CritiqueOutput>, input: CritiqueInput): CritiqueOutput {
  const score = Math.max(0, Math.min(100, Number(raw.critique_score ?? 50)));
  const confidence = Math.max(0, Math.min(100, Number(raw.executive_confidence ?? 50)));
  const risk = Math.max(0, Math.min(1, Number(raw.generic_output_risk ?? 0.5)));

  return {
    critique_score: score,
    hidden_assumptions: Array.isArray(raw.hidden_assumptions) ? raw.hidden_assumptions : [],
    strategic_risks: Array.isArray(raw.strategic_risks) ? raw.strategic_risks : [],
    weak_reasoning: Array.isArray(raw.weak_reasoning) ? raw.weak_reasoning : [],
    contradiction_flags: Array.isArray(raw.contradiction_flags) ? raw.contradiction_flags : [],
    generic_output_risk: risk,
    executive_confidence: confidence,
    recommendation: raw.recommendation ?? deriveRecommendation(score),
    meta: {
      agent: "StrategicCriticAgent",
      version: "1.0.0",
      evaluated_at: new Date().toISOString(),
      input_hash: btoa(JSON.stringify(input).slice(0, 64)).slice(0, 16),
    },
  };
}

export async function runStrategicCritic(input: CritiqueInput): Promise<CritiqueOutput> {
  const prompt = buildCritiquePrompt(input);
  const raw = await callClaude([{ role: "user", content: prompt }], CRITIQUE_SYSTEM_PROMPT);

  let parsed: Partial<CritiqueOutput>;
  try {
    parsed = parseJsonResponse<Partial<CritiqueOutput>>(raw);
  } catch {
    parsed = {
      critique_score: 0,
      strategic_risks: ["Failed to parse critique response — treat as REJECT"],
      recommendation: "REJECT",
    };
  }

  return sanitizeOutput(parsed, input);
}
