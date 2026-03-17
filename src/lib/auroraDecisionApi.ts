export type DemoAbsorption = "yes" | "restricted" | "no";
export type DemoReversibility = "full" | "partial" | "none";

export interface AuroraDecisionResult {
  protocol: string;
  protocol_version: string;
  decision_id: string;
  decision_hash: string;
  run_signature: string;
  timestamp: string;
  reasoning_basis: string;
  structural_pressure: {
    structural_load: number;
    structural_pressure: number;
    structural_risk_classification: string;
    pressure_points: string[];
    compression_mechanisms: string[];
  };
  risk_level?: string;
  executive_summary: string;
  key_risks: string[];
  counterfactual: string;
  recommendation: string;
  decision_footprint: {
    protocol: string;
    run_signature: string;
    reasoning_basis: string;
    traceability: string[];
  };
}

interface RequestDecisionOptions {
  capital: number;
  absorption: DemoAbsorption;
  reversibility: DemoReversibility;
}

function mapReversibility(reversibility: DemoReversibility): "high" | "medium" | "low" {
  switch (reversibility) {
    case "full":
      return "high";
    case "partial":
      return "medium";
    case "none":
      return "low";
  }
}

function describeAbsorption(absorption: DemoAbsorption): string {
  switch (absorption) {
    case "yes":
      return "Market absorption remains open.";
    case "restricted":
      return "Market absorption is restricted.";
    case "no":
      return "Market absorption is blocked.";
  }
}

function describeReversibility(reversibility: DemoReversibility): string {
  switch (reversibility) {
    case "full":
      return "Reversibility remains high.";
    case "partial":
      return "Reversibility is partial.";
    case "none":
      return "Reversibility is locked.";
  }
}

function buildDecisionPayload({
  capital,
  absorption,
  reversibility
}: RequestDecisionOptions) {
  return {
    title: `Evaluate capital commitment of USD ${capital}`,
    decision_type: "capital_allocation",
    spend_amount: capital,
    revenue_context: describeAbsorption(absorption),
    reversibility: mapReversibility(reversibility),
    time_horizon: "45 days",
    expected_upside: "Preserve execution capacity before irreversible commitment.",
    key_constraint: `${describeAbsorption(absorption)} ${describeReversibility(reversibility)}`,
    notes: "Public demo payload adapted from three visible inputs in aurora-site."
  };
}

function readCanonicalDecision(payload: unknown): AuroraDecisionResult {
  const candidate = (payload as { data?: { canonical?: AuroraDecisionResult }; canonical?: AuroraDecisionResult })?.data
    ?.canonical ??
    (payload as { canonical?: AuroraDecisionResult })?.canonical ??
    payload;

  if (
    !candidate ||
    typeof candidate !== "object" ||
    typeof (candidate as AuroraDecisionResult).decision_id !== "string" ||
    typeof (candidate as AuroraDecisionResult).run_signature !== "string" ||
    typeof (candidate as AuroraDecisionResult).protocol !== "string"
  ) {
    throw new Error("Aurora OS did not return a canonical decision payload.");
  }

  return candidate as AuroraDecisionResult;
}

export async function requestAuroraDecision(options: RequestDecisionOptions): Promise<AuroraDecisionResult> {
  const endpoint = import.meta.env.PUBLIC_AURORA_DECISION_ENDPOINT;

  if (!endpoint) {
    throw new Error(
      "Demo endpoint not configured. Aurora Site now renders Aurora OS output only and no longer computes decision identity locally."
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(buildDecisionPayload(options))
  });

  if (!response.ok) {
    throw new Error(`Aurora OS request failed with status ${response.status}.`);
  }

  return readCanonicalDecision(await response.json());
}
