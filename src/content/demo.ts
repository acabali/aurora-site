/**
 * Demo — copy único. Sin números. Sin scoring visible.
 */

export const demo = {
  category: "decision",
  categoryLabel: "Decisión",
  questions: [
    "¿La decisión depende de condiciones que controlás?",
    "¿Tenés visibilidad sobre el impacto antes de comprometer recursos?",
    "¿El criterio está alineado con quien ejecuta?",
  ] as const,
  analyzing: "Analizando interacción…",
  emailPlaceholder: "Correo electrónico",
  emailRequired: "El correo es obligatorio.",
  alreadyExecuted: "Ya analizaste una decisión.",
  alreadyExecutedSub: "Para evaluar otra, contáctanos.",
} as const;
