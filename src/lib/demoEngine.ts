export type DemoScenario =
  | "cash-stress"
  | "cost-break"
  | "automation-blind"
  | "pricing-pace";

export type SignalA = "late-collection" | "early-collection";
export type SignalB = "quality-time" | "control-visibility";

type DemoInput = {
  country: string;
  industry: string;
  size: string;
  scenario: DemoScenario;
  signalA: SignalA;
  signalB: SignalB;
};

type DemoOutput = {
  line1: string;
  line2: string;
  line3: string;
};

const BASE_OUTPUTS: Record<string, DemoOutput> = {
  "cash-stress|late-collection|quality-time": {
    line1: "Tu crecimiento se apoya en una caja que se desordena antes de sostenerse.",
    line2: "La presión de cobros tardíos y calidad inestable termina frenando la venta que buscabas.",
    line3: "Primero mirá el cruce entre ritmo de cobro y capacidad operativa real.",
  },
  "cash-stress|late-collection|control-visibility": {
    line1: "Tu expansión quedó expuesta por falta de visibilidad sobre el ciclo de caja.",
    line2: "Cuando cobrás tarde y perdés control, el costo aparece fuera de foco.",
    line3: "Primero mirá los desvíos entre compromisos de pago y señales de control.",
  },
  "cost-break|early-collection|quality-time": {
    line1: "El ahorro que aplicaste debilitó la parte del servicio que más percibe el cliente.",
    line2: "Aunque cobres antes, la fricción operativa erosiona la decisión en silencio.",
    line3: "Primero mirá qué proceso crítico perdió consistencia después del ajuste.",
  },
};

const FALLBACK_OUTPUT: DemoOutput = {
  line1: "Tu decisión activa una fricción que hoy no está siendo observada de forma integrada.",
  line2: "Cuando cobro, pago y operación se tensan al mismo tiempo, el costo se acelera.",
  line3: "Primero mirá el punto donde caja y operación dejan de moverse al mismo ritmo.",
};

function withContext(output: DemoOutput, input: DemoInput): DemoOutput {
  const contextLead =
    input.industry === "Servicios"
      ? "En servicios, esta fricción suele aparecer en la entrega antes que en el reporte."
      : input.industry === "Comercio"
      ? "En comercio, esta fricción suele aparecer en reposición y cobro antes de verse completa."
      : input.size === "200+"
      ? "En equipos grandes, esta fricción escala por coordinación antes de ser evidente."
      : input.size === "1–10"
      ? "En equipos chicos, esta fricción impacta directo en caja y foco operativo."
      : input.country === "Argentina"
      ? "Con la dinámica local, esta fricción se amplifica cuando el flujo de cobro pierde ritmo."
      : "Este patrón se vuelve crítico cuando dos fuerzas se activan a la vez.";

  return {
    line1: output.line1,
    line2: output.line2,
    line3: `${output.line3} ${contextLead}`,
  };
}

export function evaluateDecision(input: DemoInput): DemoOutput {
  const key = `${input.scenario}|${input.signalA}|${input.signalB}`;
  const base = BASE_OUTPUTS[key] ?? FALLBACK_OUTPUT;
  return withContext(base, input);
}
