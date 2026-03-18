import type { APIRoute } from "astro";
import { evaluateMovement } from "../../lib/aurora/decision/movementEngine";
import {
  normalizeDecisionInput,
  normalizeRiskLevel,
  type DecisionResponse,
} from "../../lib/aurora/decision/types";
import { getClaudeDecision } from "../../lib/aurora/server/claudeDecision";

function normalizeDecisionResponse(raw: Record<string, unknown>): DecisionResponse {
  const hash = String(raw.decision_hash ?? raw.decisionHash ?? "").toLowerCase();
  const decisionId =
    typeof raw.decision_id === "string" && raw.decision_id.trim().length > 0
      ? raw.decision_id.trim()
      : typeof raw.decisionId === "string" && raw.decisionId.trim().length > 0
        ? raw.decisionId.trim()
      : hash
        ? `dec_${hash}`
        : "";

  return {
    risk_level: normalizeRiskLevel(raw.risk_level ?? raw.riskLevel),
    insight: String(raw.insight ?? "").trim(),
    counterfactual: String(raw.counterfactual ?? "").trim(),
    decision_hash: hash,
    decision_id: decisionId,
    pressure_score:
      typeof raw.pressure_score === "number" ? raw.pressure_score :
      typeof raw.pressureScore === "number" ? raw.pressureScore :
      undefined,
    pressure_day:
      typeof raw.pressure_day === "number" ? raw.pressure_day :
      typeof raw.pressureDay === "number" ? raw.pressureDay :
      undefined,
    structural_load:
      raw.structural_load ? String(raw.structural_load).trim() :
      raw.structuralLoad ? String(raw.structuralLoad).trim() :
      undefined,
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = normalizeDecisionInput(await request.json());
    const mode = (process.env.AURORA_MODE || "local").toLowerCase();

    if (mode === "claude") {
      try {
        const claude = await getClaudeDecision(body);
        return new Response(JSON.stringify(normalizeDecisionResponse(claude as Record<string, unknown>)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("[/api/decision] Claude failed → fallback local:", error);
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
          pressureScore: result.pressureScore,
          pressureDay: result.pressureDay,
          structuralLoad: result.structuralLoad,
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
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
