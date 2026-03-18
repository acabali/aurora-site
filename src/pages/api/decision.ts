import type { APIRoute } from "astro";
import { evaluateMovement } from "../../lib/aurora/decision/movementEngine";
import { getClaudeDecision } from "../../lib/aurora/server/claudeDecision";

type CanonRisk = "RIESGO_BAJO" | "RIESGO_CONTROLADO" | "RIESGO_CRITICO";

function normalizeRiskLevel(value: unknown): CanonRisk {
  const v = String(value ?? "").trim().toUpperCase();

  if (
    [
      "RIESGO_CRITICO",
      "RIESGO_CRÍTICO",
      "CRITICO",
      "CRÍTICO",
      "ALTO",
      "HIGH",
      "SEVERE",
    ].includes(v)
  ) return "RIESGO_CRITICO";

  if (
    [
      "RIESGO_CONTROLADO",
      "CONTROLADO",
      "MEDIO",
      "MODERADO",
      "MEDIUM",
    ].includes(v)
  ) return "RIESGO_CONTROLADO";

  return "RIESGO_BAJO";
}

function normalizeDecisionResponse(raw: any) {
  return {
    risk_level: normalizeRiskLevel(raw?.risk_level ?? raw?.riskLevel),
    insight: String(raw?.insight ?? "").trim(),
    counterfactual: String(raw?.counterfactual ?? "").trim(),
    decision_id: String(raw?.decision_id ?? raw?.decisionId ?? "").trim(),
    decision_hash: String(raw?.decision_hash ?? raw?.decisionHash ?? "").trim(),
    pressure_score: typeof raw?.pressure_score === "number" ? raw.pressure_score : undefined,
    pressure_day: typeof raw?.pressure_day === "number" ? raw.pressure_day : undefined,
    structural_load: raw?.structural_load ? String(raw.structural_load).trim() : undefined,
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const mode = (process.env.AURORA_MODE || "local").toLowerCase();

    if (mode === "claude") {
      try {
        const claude = await getClaudeDecision(body);
        return new Response(JSON.stringify(normalizeDecisionResponse(claude)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("[/api/decision] Claude failed, falling back to local engine:", error);
      }
    }

    const result = await evaluateMovement(body);

    return new Response(
      JSON.stringify(
        normalizeDecisionResponse({
          riskLevel: result.riskLevel,
          insight: result.insight,
          counterfactual: result.counterfactual,
          decisionId: result.decisionId,
          decisionHash: result.decisionHash,
        })
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[/api/decision] server_error:", err);

    return new Response(
      JSON.stringify({
        error: "server_error",
        message: "Aurora evaluation failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
