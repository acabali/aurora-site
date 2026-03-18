import type { APIRoute } from "astro";
import { evaluateMovement } from "../../lib/aurora/decision/movementEngine";
import { getClaudeDecision } from "../../lib/aurora/server/claudeDecision";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const mode = (process.env.AURORA_MODE || "local").toLowerCase();

    if (mode === "claude") {
      try {
        const claude = await getClaudeDecision(body);

        return new Response(JSON.stringify(claude), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("[/api/decision] Claude failed, falling back to local engine:", error);
      }
    }

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
