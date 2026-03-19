import { AuroraApiError, postDecision } from "../src/lib/aurora/client.js";
import type { AuroraDecisionPayload } from "../src/lib/aurora/client.js";

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

type DemoAbsorption = "yes" | "restricted" | "no";
type DemoReversibility = "low" | "medium" | "high";

interface DemoDecisionPayload {
  capital: number;
  absorption: DemoAbsorption;
  reversibility: DemoReversibility;
}

function parseDecisionBody(body: unknown): DemoDecisionPayload {
  const parsedBody =
    typeof body === "string" ? (JSON.parse(body) as Record<string, unknown>) : body;

  if (!parsedBody || typeof parsedBody !== "object") {
    throw new Error("Decision payload must be a JSON object");
  }

  const capital = Number((parsedBody as Record<string, unknown>).capital);
  const absorption = String((parsedBody as Record<string, unknown>).absorption ?? "");
  const reversibility = String((parsedBody as Record<string, unknown>).reversibility ?? "");

  if (!Number.isFinite(capital) || capital < 0) {
    throw new Error("Decision payload must include a non-negative capital number");
  }

  if (!["yes", "restricted", "no"].includes(absorption)) {
    throw new Error("Decision payload must include a valid absorption value");
  }

  if (!["low", "medium", "high"].includes(reversibility)) {
    throw new Error("Decision payload must include a valid reversibility value: low, medium, or high");
  }

  return {
    capital,
    absorption: absorption as DemoAbsorption,
    reversibility: reversibility as DemoReversibility,
  };
}

function formatUsd(capital: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(capital);
}

function mapDemoDecisionPayload(payload: DemoDecisionPayload): AuroraDecisionPayload {
  const absorptionSummary =
    payload.absorption === "yes"
      ? {
          title: "Market absorbs the movement with bounded resistance",
          decisionType: "bounded_allocation",
          revenueContext:
            "The surrounding market can absorb the movement without immediate structural spillover.",
          expectedUpside:
            "Validate demand under controlled exposure while preserving execution capacity.",
          keyConstraint:
            "Do not mistake apparent absorption for durable slack once capital is committed.",
        }
      : payload.absorption === "restricted"
        ? {
            title: "Market absorption is restricted and friction is visible",
            decisionType: "operational_change",
            revenueContext:
              "The market absorbs the movement only partially, so execution pressure can accumulate early.",
            expectedUpside:
              "Test whether the movement can clear without forcing compensating corrections downstream.",
            keyConstraint:
              "Restricted absorption means local friction can become structural load quickly.",
          }
        : {
            title: "Market does not absorb the movement cleanly",
            decisionType: "capital_allocation",
            revenueContext:
              "The surrounding market does not absorb the movement, so pressure remains exposed after commitment.",
            expectedUpside:
              "Surface the real cost of commitment before compression becomes visible in the system.",
            keyConstraint:
              "Non-absorption converts committed capital into immediate structural pressure.",
          };

  const timeHorizon =
    payload.reversibility === "high"
      ? "6 weeks"
      : payload.reversibility === "medium"
        ? "1 quarter"
        : "12 months";

  const capitalLabel = formatUsd(payload.capital);

  return {
    title: `${absorptionSummary.title} for a USD ${capitalLabel} commitment`,
    decision_type: absorptionSummary.decisionType,
    spend_amount: payload.capital,
    revenue_context: `${absorptionSummary.revenueContext} Committed capital: USD ${capitalLabel}.`,
    reversibility: payload.reversibility,
    time_horizon: timeHorizon,
    expected_upside: absorptionSummary.expectedUpside,
    key_constraint: absorptionSummary.keyConstraint,
    notes: `aurora-site demo relay | absorption=${payload.absorption} | reversibility=${payload.reversibility} | capital=${payload.capital}`,
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  let payload: DemoDecisionPayload;

  try {
    payload = parseDecisionBody(req.body);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "INVALID_DECISION_PAYLOAD",
      message: error instanceof Error ? error.message : "Invalid decision payload",
    });
    return;
  }

  try {
    const decision = await postDecision(mapDemoDecisionPayload(payload));
    res.status(200).json(decision);
  } catch (error) {
    if (error instanceof AuroraApiError) {
      res.status(error.status ?? 502).json({
        success: false,
        error: "AURORA_DECISION_FAILED",
        message: error.message,
        upstreamStatus: error.status ?? null,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "AURORA_DECISION_FAILED",
      message: error instanceof Error ? error.message : "Unknown decision error",
    });
  }
}
