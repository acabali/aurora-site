import type { APIRoute } from "astro";
import { evaluateMovement } from "../../lib/aurora/decision/movementEngine";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const result = await evaluateMovement(body);

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
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "server_error",
        message: "Aurora evaluation failed",
      }),
      { status: 500 }
    );
  }
};
