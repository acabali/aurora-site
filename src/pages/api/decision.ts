import type { APIRoute } from "astro";
import { evaluateMovement } from "../../lib/aurora/decision/movementEngine";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: "validation",
          message: "Content-Type debe ser application/json",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "system_unavailable",
        message: "Aurora no pudo procesar la decisión.",
        detail: error instanceof Error ? error.message : "unknown_error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
