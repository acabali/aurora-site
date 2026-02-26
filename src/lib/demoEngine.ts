/**
 * Motor de decisión — determinístico. Sin random. Sin AI.
 * 0 respuestas negativas (false) → low
 * 1 negativa → medium
 * 2 o más → high
 * Solo se usa para elegir 1 texto único (3 líneas). tensionLevel no se muestra.
 */

export type TensionLevel = "low" | "medium" | "high";

const OUTPUTS: Record<TensionLevel, { line1: string; line2: string; line3: string }> = {
  low: {
    line1: "Tu decisión descansa sobre variables que hoy podés contrastar.",
    line2: "La exposición se mantiene acotada si las condiciones se sostienen.",
    line3: "El siguiente paso es fijar el punto de revisión.",
  },
  medium: {
    line1: "Tu decisión depende de estabilidad que hoy no está garantizada.",
    line2: "Si las variables se mueven juntas, la fricción aumenta.",
    line3: "La exposición no será visible al inicio.",
  },
  high: {
    line1: "La decisión está apoyada en supuestos no verificados.",
    line2: "Cualquier desvío se amplifica en la ejecución.",
    line3: "Conviene contrastar antes de comprometer.",
  },
};

export function evaluateDecision(input: {
  category: string;
  answers: [boolean, boolean, boolean];
}): {
  vulnerability: { line1: string; line2: string; line3: string };
  tensionLevel: TensionLevel;
} {
  const negatives = input.answers.filter((a) => !a).length;
  const tensionLevel: TensionLevel =
    negatives === 0 ? "low" : negatives === 1 ? "medium" : "high";
  const vulnerability = OUTPUTS[tensionLevel];
  return { vulnerability, tensionLevel };
}
