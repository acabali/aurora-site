// Aurora Movement Engine — deterministic capital movement classifier
// Inputs: capital (number), absorption ("yes"|"restricted"|"no"), reversibility ("full"|"partial"|"none")
// Outputs: pressureScore, pressureDay, correctionWindowDays
// DO NOT add probabilistic, interpretive, or recommendation language here.

export type Absorption = "yes" | "restricted" | "no";
export type ReversibilityLevel = "full" | "partial" | "none";

export interface MovementInput {
  capital: number;
  absorption: Absorption;
  reversibility: ReversibilityLevel;
}

export interface MovementOutput {
  pressureScore: number;
  pressureDay: number;
  correctionWindowDays: number;
}

function absorptionFactor(absorption: Absorption): number {
  if (absorption === "no") return 1.0;
  if (absorption === "restricted") return 0.6;
  return 0.2; // "yes"
}

function reversibilityFactor(reversibility: ReversibilityLevel): number {
  if (reversibility === "none") return 1.0;
  if (reversibility === "partial") return 0.6;
  return 0.2; // "full"
}

export function computeMovement(input: MovementInput): MovementOutput {
  const { capital, absorption, reversibility } = input;

  const capitalFactor = Math.min(capital / 100000, 1);

  const pressureScore = Math.min(
    1,
    Math.max(
      0,
      capitalFactor * 0.45 +
        absorptionFactor(absorption) * 0.35 +
        reversibilityFactor(reversibility) * 0.20
    )
  );

  // pressureDay: single deterministic day, range 21–45
  const pressureDay = Math.round(21 + (1 - pressureScore) * 24);

  // correctionWindowDays: complement within the 45-day horizon
  const correctionWindowDays = 45 - pressureDay;

  return { pressureScore, pressureDay, correctionWindowDays };
}
