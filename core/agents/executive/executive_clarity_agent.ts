import type { ClarityInput, ClarityOutput } from "../../types.js";

const CLARITY_SYSTEM_PROMPT = `You are an executive clarity enforcer for high-stakes decisions.
Your job is to strip every output down to signal.

You eliminate:
- Abstract language that sounds smart but says nothing
- Buzzwords (leverage, synergy, scalable, ecosystem, robust, paradigm)
- Non-actionable wording (e.g. "consider exploring", "may want to evaluate")
- Passive voice that hides accountability
- Sentences longer than 25 words that could be cut in half
- Technical complexity that has no business translation

You rewrite executive summaries so a CFO with 30 seconds can understand the decision, the risk, and the call.

Output structured JSON only. No preamble. No explanation outside the JSON.

Scoring rules:
- clarity_score: 0-100. Below 70 = FAIL. 100 = a surgeon's scalpel.
- complexity_reduction_pct: percentage by which you reduced conceptual complexity (0-100).
- jargon_removed: exact phrases excised.
- decision_one_liner: the entire decision in one sentence, under 20 words.
- business_risk_summary: the real financial/operational risk, two sentences max.`;

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
  if (!match) throw new Error("No JSON object found in clarity response");
  return JSON.parse(match[0]) as T;
}

const JARGON_PATTERNS = [
  "leverage",
  "synergy",
  "synergies",
  "scalable",
  "ecosystem",
  "robust",
  "paradigm",
  "holistic",
  "optimize",
  "streamline",
  "value proposition",
  "best-in-class",
  "world-class",
  "cutting-edge",
  "innovative",
  "disruptive",
  "granular",
  "bandwidth",
  "move the needle",
  "low-hanging fruit",
  "pivot",
  "circle back",
  "deep dive",
  "boil the ocean",
  "alignment",
  "value-add",
  "operationalize",
  "socialize",
  "learnings",
  "impactful",
];

function detectJargon(text: string): string[] {
  const lower = text.toLowerCase();
  return JARGON_PATTERNS.filter((j) => lower.includes(j));
}

function buildClarityPrompt(input: ClarityInput): string {
  const detectedJargon = detectJargon(input.executive_summary);

  return `Rewrite this executive summary for brutal clarity. Return JSON only.

ORIGINAL EXECUTIVE SUMMARY:
${input.executive_summary}

DECISION CONTEXT:
${JSON.stringify(input.decision_context, null, 2)}

PRE-DETECTED JARGON (must remove all of these if present):
${JSON.stringify(detectedJargon)}

Return ONLY this JSON structure:
{
  "clarity_score": <number 0-100>,
  "executive_summary_rewritten": <string, plain language, no jargon, under 150 words>,
  "complexity_reduction_pct": <number 0-100>,
  "jargon_removed": [<string>, ...],
  "decision_one_liner": <string, under 20 words, the full decision in one sentence>,
  "business_risk_summary": <string, 2 sentences max, real financial/operational risk only>
}`;
}

function sanitizeOutput(raw: Partial<ClarityOutput>, input: ClarityInput): ClarityOutput {
  const clarityScore = Math.max(0, Math.min(100, Number(raw.clarity_score ?? 0)));
  const reductionPct = Math.max(0, Math.min(100, Number(raw.complexity_reduction_pct ?? 0)));

  const jargonRemoved = Array.isArray(raw.jargon_removed)
    ? raw.jargon_removed
    : detectJargon(input.executive_summary);

  return {
    clarity_score: clarityScore,
    executive_summary_rewritten: raw.executive_summary_rewritten ?? input.executive_summary,
    complexity_reduction_pct: reductionPct,
    jargon_removed: jargonRemoved,
    decision_one_liner: raw.decision_one_liner ?? "Decision requires rewrite — clarity failed.",
    business_risk_summary:
      raw.business_risk_summary ?? "Risk assessment unavailable due to clarity failure.",
    meta: {
      agent: "ExecutiveClarityAgent",
      version: "1.0.0",
      evaluated_at: new Date().toISOString(),
      pass: clarityScore >= 70,
    },
  };
}

export async function runExecutiveClarity(input: ClarityInput): Promise<ClarityOutput> {
  const prompt = buildClarityPrompt(input);
  const raw = await callClaude([{ role: "user", content: prompt }], CLARITY_SYSTEM_PROMPT);

  let parsed: Partial<ClarityOutput>;
  try {
    parsed = parseJsonResponse<Partial<ClarityOutput>>(raw);
  } catch {
    parsed = {
      clarity_score: 0,
      executive_summary_rewritten: input.executive_summary,
      complexity_reduction_pct: 0,
      jargon_removed: detectJargon(input.executive_summary),
      decision_one_liner: "Clarity evaluation failed — manual review required.",
      business_risk_summary: "Unable to assess business risk — clarity agent returned no output.",
    };
  }

  return sanitizeOutput(parsed, input);
}
