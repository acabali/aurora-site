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
  "cash-stress|early-collection|quality-time": {
    line1: "Aunque cobres antes, la operación no está sosteniendo el ritmo de crecimiento.",
    line2: "La caja respira, pero la calidad se rompe donde el cliente sí lo percibe.",
    line3: "Primero mirá el punto donde la entrega deja de acompañar la demanda.",
  },
  "cash-stress|early-collection|control-visibility": {
    line1: "La expansión avanza sin una lectura confiable de la ejecución diaria.",
    line2: "El cobro acompaña, pero la falta de control abre costo oculto en cada ciclo.",
    line3: "Primero mirá dónde perdés visibilidad al mismo tiempo que acelerás.",
  },
  "cost-break|late-collection|quality-time": {
    line1: "El ajuste de costos te dejó más expuesto justo donde el servicio se tensiona.",
    line2: "Con cobros tardíos y calidad inestable, la caja absorbe una fricción doble.",
    line3: "Primero mirá qué recorte está afectando la promesa que sí se nota.",
  },
  "cost-break|late-collection|control-visibility": {
    line1: "El ahorro aplicado debilitó tu control en un momento de cobro frágil.",
    line2: "Cuando cobrás tarde y ves menos, el costo aparece cuando ya impactó.",
    line3: "Primero mirá qué parte del ajuste te dejó sin señales tempranas.",
  },
  "cost-break|early-collection|quality-time": {
    line1: "El ahorro que aplicaste debilitó la parte del servicio que más percibe el cliente.",
    line2: "Aunque cobres antes, la fricción operativa erosiona la decisión en silencio.",
    line3: "Primero mirá qué proceso crítico perdió consistencia después del ajuste.",
  },
  "cost-break|early-collection|control-visibility": {
    line1: "El recorte mejoró el flujo, pero te dejó operando con menos control real.",
    line2: "La caja sostiene el corto plazo mientras crece el costo que no estás viendo.",
    line3: "Primero mirá qué control se perdió al bajar estructura.",
  },
  "automation-blind|late-collection|quality-time": {
    line1: "La automatización tapó señales justo cuando la operación necesita precisión.",
    line2: "Con cobro tardío y calidad en riesgo, el error se vuelve más caro al corregir.",
    line3: "Primero mirá dónde el flujo automático está ocultando desvíos críticos.",
  },
  "automation-blind|late-collection|control-visibility": {
    line1: "Automatizaste, pero la visibilidad cayó en el tramo más sensible de caja.",
    line2: "Cuando cobrás tarde y perdés control, los errores llegan cuando ya pesan.",
    line3: "Primero mirá qué decisión quedó sin monitoreo real en el circuito de cobro.",
  },
  "automation-blind|early-collection|quality-time": {
    line1: "El sistema gana velocidad, pero la calidad se degrada fuera del tablero.",
    line2: "Aunque el cobro acompaña, el costo aparece en retrabajo y corrección tardía.",
    line3: "Primero mirá qué parte automatizada está afectando la experiencia final.",
  },
  "automation-blind|early-collection|control-visibility": {
    line1: "La automatización movió el proceso más rápido que tu capacidad de control.",
    line2: "La caja no avisa el problema: lo hace la operación cuando ya hay pérdida.",
    line3: "Primero mirá dónde el control quedó por detrás de la ejecución automática.",
  },
  "pricing-pace|late-collection|quality-time": {
    line1: "El ajuste de precio cambió el ritmo, pero la operación no logró absorberlo.",
    line2: "Con cobro tardío y caída de calidad, la decisión pierde efecto económico.",
    line3: "Primero mirá la brecha entre nueva política comercial y capacidad operativa.",
  },
  "pricing-pace|late-collection|control-visibility": {
    line1: "Cambiaste precios y ritmo de cobro sin una lectura completa del impacto real.",
    line2: "La cobranza se retrasa y el control se afloja, dejando costo fuera de vista.",
    line3: "Primero mirá dónde el nuevo esquema comercial rompe el control financiero.",
  },
  "pricing-pace|early-collection|quality-time": {
    line1: "El nuevo ritmo comercial ordena caja, pero tensiona la entrega más visible.",
    line2: "La mejora de cobro se compensa con fricción operativa que erosiona margen.",
    line3: "Primero mirá qué ajuste de precio está forzando procesos críticos.",
  },
  "pricing-pace|early-collection|control-visibility": {
    line1: "El cambio comercial parece sano, pero dejó zonas sin control operativo.",
    line2: "Cobrás mejor, pero la falta de visibilidad instala costos que no ves al inicio.",
    line3: "Primero mirá qué parte del nuevo esquema se ejecuta sin control suficiente.",
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
