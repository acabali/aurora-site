import type { APIRoute } from "astro";
import { evaluateMovement } from "../../lib/aurora/decision/movementEngine";

export const POST: APIRoute = async ({ request }) => {
  try {
    const input = await request.json();
    const result = evaluateMovement(input);

    return new Response(
      JSON.stringify({
        risk_level: result.riskLevel,
        insight: result.insight,
        counterfactual: result.counterfactual,
        decision_id: result.decisionId,
        decision_hash: result.decisionHash,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "system_unavailable",
        message: "Aurora no pudo procesar la decisión."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
