export type Locale = "es" | "en";

export interface HeroReadoutRow {
  label: string;
  value: string;
}

export interface HeroReadout {
  eyebrow: string;
  rows: HeroReadoutRow[];
}

export interface OutputItem {
  title: string;
  body: string;
}

export interface ProductSystemBlock {
  num: string;
  title: string;
  signalKey: string;
  tagline: string;
  points: string[];
  whyEyebrow: string;
  whyPoints: string[];
}

export interface ProductSystem {
  navEyebrow: string;
  topLines: string[];
  blocks: ProductSystemBlock[];
}

export interface FooterNavLink {
  label: string;
  href: "home" | "demo";
}

export interface HomeContent {
  title: string;
  navCta: string;
  hero: {
    kicker: string;
    h1Line1: string;
    h1Line2: string;
    statementHtml: string;
    cta: string;
    note: string;
  };
  heroReadout: HeroReadout;
  yapaso: {
    eyebrow: string;
    headline: string;
    track: { status: string; industry: string; desc: string; variant: "done" | "next" }[];
    bottom: string;
    verdict: string;
    cost: string;
  };
  complexity: {
    eyebrow: string;
    headline: string;
    items: { num: string; title: string; body: string }[];
    bottomBig: string;
    bottomAccent: string;
  };
  outputs: {
    intro: string;
    headline: string;
    desc: string;
    items: OutputItem[];
  };
  productSystem?: ProductSystem;
  systemDef: [string, string, string, string];
  inevitable: {
    eyebrow: string;
    headline: string;
    lead: string;
    stairs: { year: string; label: string; note: string }[];
    coda: string;
  };
  gateway: {
    kicker: string;
    h1: string;
    sub: string;
    cta: string;
    aside: string;
  };
  contact: {
    placeholder: string;
    emailPlaceholder: string;
  };
  footer: {
    descriptor: string;
    nav: FooterNavLink[];
    copyright: string;
  };
}

export const homeContent: Record<Locale, HomeContent> = {
  es: {
    title: "Aurora",
    navCta: "Ver qué rompe tu próximo movimiento →",
    hero: {
      kicker: "Aurora",
      h1Line1: "La mente humana tiene un límite.",
      h1Line2: "La realidad no.",
      statementHtml:
        "Cada decisión que tomás tiene consecuencias que no calculaste.<br/>No porque seas negligente. Porque no se puede a mano.<br/><br/><strong>Aurora lo calcula. Antes de que muevas un peso.</strong>",
      cta: "Ver qué rompe tu próximo movimiento →",
      note: "Sin registro · Solo el cálculo",
    },
    heroReadout: {
      eyebrow: "Readout — estado bajo carga",
      rows: [
        { label: "Presión dominante", value: "Caja y tiempo, acoplados." },
        { label: "Superficie de ruptura", value: "Un supuesto clave sin testeo." },
        { label: "Ventana reversible", value: "Se cierra sin señal explícita." },
        { label: "Dependencias activadas", value: "Operación, equipo, proveedores." },
      ],
    },
    yapaso: {
      eyebrow: "Inevitabilidad",
      headline: "Lo que ya pasó en otros sistemas vuelve acá.",
      track: [
        {
          status: "Hecho",
          industry: "Operación",
          desc: "El error aparece después del cierre.",
          variant: "done",
        },
        {
          status: "Hecho",
          industry: "Caja",
          desc: "El costo real queda fuera del plan inicial.",
          variant: "done",
        },
        {
          status: "Siguiente",
          industry: "Tu movimiento",
          desc: "Sin cálculo previo, heredás la misma curva.",
          variant: "next",
        },
      ],
      bottom: "No es suerte. Es estructura repetida.",
      verdict: "Ver el mapa antes ejecutar.",
      cost: "Si no calculás, pagás en ejecución.",
    },
    complexity: {
      eyebrow: "Escala",
      headline: "Cada capa suma variables. La vista no.",
      items: [
        {
          num: "01",
          title: "Más opciones",
          body: "Más rutas de falla. La intuición elige sin cerrar cuentas.",
        },
        {
          num: "02",
          title: "Más velocidad",
          body: "Menos margen para corregir. El tiempo actúa en contra.",
        },
        {
          num: "03",
          title: "Más exposición",
          body: "Caja y equipo quedan acoplados. Se mueve uno, se mueve el otro.",
        },
      ],
      bottomBig: "La intuición no escala.",
      bottomAccent: "El cálculo sí.",
    },
    outputs: {
      intro: "Outputs",
      headline: "Lo que Aurora calcula antes de que muevas un peso.",
      desc: "Sin narrativa. Solo estructura devuelta.",
      items: [
        {
          title: "Qué rompe",
          body: "El primer nodo que derriba el resto si falla. Visible antes del compromiso.",
        },
        {
          title: "Qué activa",
          body: "Cadenas que aparecen con el movimiento. Sin pedirlas explícitamente.",
        },
        {
          title: "Qué depende",
          body: "Acoples entre caja, operación y equipo bajo la decisión actual.",
        },
        {
          title: "Cuándo deja de ser reversible",
          body: "El punto donde la marcha atrás ya no cierra sin costo nuevo.",
        },
      ],
    },
    productSystem: {
      navEyebrow: "Sistema · 06 módulos",
      topLines: [
        "Aurora cruza millones de datos reales de operaciones.",
        "Analiza patrones históricos de comportamiento.",
        "Aplica modelos matemáticos para entender cómo interactúan las variables.",
        "Usa modelos estructurales para simular resultados.",
        "Y conecta todo en un sistema que calcula qué va a pasar antes de que el capital se mueva.",
      ],
      blocks: [
        {
          num: "01",
          title: "Grafo de costos invisibles",
          signalKey: "capital_delta",
          tagline: "👉 O ves todos los costos o tu margen ya está comprometido",
          points: [
            "Identifica costos que no aparecen en tu estructura actual",
            "Detecta dónde el gasto no retorna capital",
            "Calcula el impacto total por operación (no parcial)",
            "Prioriza qué costos eliminar para recuperar margen",
          ],
          whyEyebrow: "Por qué Aurora lo hace mejor",
          whyPoints: [
            "Conecta costos, operación y datos reales en un mismo sistema",
            "Detecta patrones que no aparecen en ningún reporte",
            "No depende de cómo cargás la información, calcula comportamiento real",
          ],
        },
        {
          num: "02",
          title: "Motor de rentabilidad comercial",
          signalKey: "margin_pressure",
          tagline: "👉 O cada venta deja capital o lo destruye",
          points: [
            "Calcula la ganancia real por cliente y canal",
            "Detecta ventas con margen negativo aunque facturen",
            "Identifica qué parte del negocio erosiona rentabilidad",
            "Define qué sostener, escalar o cortar",
          ],
          whyEyebrow: "Por qué Aurora lo hace mejor",
          whyPoints: [
            "Integra marketing, operación y finanzas en un solo cálculo",
            "Rompe la lógica de ROAS aislado",
            "Mide impacto en caja, no métricas intermedias",
          ],
        },
        {
          num: "03",
          title: "Radar de solvencia",
          signalKey: "solvency_window",
          tagline: "👉 O tu caja aguanta o el negocio entra en riesgo",
          points: [
            "Proyecta liquidez real en el corto plazo",
            "Detecta presión sobre caja antes de que aparezca",
            "Identifica cuándo no podés sostener la operación",
            "Define límites para no comprometer capital",
          ],
          whyEyebrow: "Por qué Aurora lo hace mejor",
          whyPoints: [
            "No mira el pasado, proyecta comportamiento futuro",
            "Cruza ingresos, costos y timing real de caja",
            "Anticipa el problema antes de que sea visible",
          ],
        },
        {
          num: "04",
          title: "Motor de precio real",
          signalKey: "price_elasticity",
          tagline: "👉 O el precio sostiene el negocio o lo debilita",
          points: [
            "Detecta si el precio cubre todos los costos reales",
            "Calcula impacto en margen ante cambios de precio",
            "Identifica cuándo el precio funciona en chico y falla al escalar",
            "Define rangos sostenibles de precio",
          ],
          whyEyebrow: "Por qué Aurora lo hace mejor",
          whyPoints: [
            "Modela interacción entre precio, volumen y costos",
            "No depende de pruebas manuales ni intuición",
            "Calcula resultado real, no hipótesis",
          ],
        },
        {
          num: "05",
          title: "Motor de compromiso de capital",
          signalKey: "commit_load",
          tagline: "👉 O invertís con retorno o comprometés capital a ciegas",
          points: [
            "Simula impacto de contratar, expandir o invertir",
            "Calcula retorno y presión sobre caja antes de ejecutar",
            "Detecta si la estructura soporta la decisión",
            "Define condiciones mínimas para avanzar",
          ],
          whyEyebrow: "Por qué Aurora lo hace mejor",
          whyPoints: [
            "Ejecuta escenarios antes de que ocurran",
            "Usa datos comparables reales, no supuestos",
            "Convierte decisiones en resultados medibles antes de invertir",
          ],
        },
        {
          num: "06",
          title: "Índice de presión operativa",
          signalKey: "op_pressure_index",
          tagline: "👉 O el negocio es sostenible o se está tensionando",
          points: [
            "Detecta dónde el sistema empieza a fallar",
            "Mide carga operativa vs capacidad real",
            "Identifica cuellos de botella críticos",
            "Define cuándo el crecimiento deja de ser viable",
          ],
          whyEyebrow: "Por qué Aurora lo hace mejor",
          whyPoints: [
            "Condensa múltiples variables en un estado claro",
            "Detecta patrones de deterioro antes de que escalen",
            "Muestra el sistema completo, no partes aisladas",
          ],
        },
      ],
    },
    systemDef: [
      "Aurora no predice. Expone presión.",
      "No recomienda. Muestra consecuencias.",
      "No interpreta. Calcula.",
      "El cálculo ejecuta.",
    ],
    inevitable: {
      eyebrow: "Estándar",
      headline: "Esto no es una mejora. Es el nuevo estándar.",
      lead: "Ejecutar sin cálculo estructural pasa a ser el riesgo normativo.",
      stairs: [
        { year: "Ahora", label: "Simulación previa", note: "Mapa antes del peso." },
        { year: "Luego", label: "Ejecución acotada", note: "Solo lo que cerró." },
        { year: "Después", label: "Débito claro", note: "Sin sorpresa de lectura." },
      ],
      coda: "Quien ejecuta sin ver el mapa asume el costo completo.",
    },
    gateway: {
      kicker: "Ahora",
      h1: "Sometelo.",
      sub: "Calculá antes.",
      cta: "Enviar a cálculo →",
      aside: "Sin registro · Solo el cálculo.",
    },
    contact: {
      placeholder: "Describí el movimiento (decisión, hipótesis, apuesta).",
      emailPlaceholder: "Correo (opcional)",
    },
    footer: {
      descriptor: "",
      nav: [
        { label: "Inicio", href: "home" },
        { label: "Demo", href: "demo" },
      ],
      copyright: "© 2026 Aurora",
    },
  },
  en: {
    title: "Aurora",
    navCta: "See what your next move breaks →",
    hero: {
      kicker: "Aurora",
      h1Line1: "The human mind has a limit.",
      h1Line2: "Reality does not.",
      statementHtml:
        "Every decision you make has consequences you did not compute.<br/>Not because you were negligent. Because it cannot be done by hand.<br/><br/><strong>Aurora computes it. Before you move weight.</strong>",
      cta: "See what your next move breaks →",
      note: "No account · Computation only",
    },
    heroReadout: {
      eyebrow: "Readout — state under load",
      rows: [
        { label: "Dominant pressure", value: "Cash and time, coupled." },
        { label: "Failure surface", value: "One core assumption untested." },
        { label: "Reversibility window", value: "Closes without a clear signal." },
        { label: "Dependencies activated", value: "Operations, team, suppliers." },
      ],
    },
    yapaso: {
      eyebrow: "Inevitability",
      headline: "What already happened elsewhere shows up here.",
      track: [
        {
          status: "Done",
          industry: "Operations",
          desc: "The error appears after the window closes.",
          variant: "done",
        },
        {
          status: "Done",
          industry: "Cash",
          desc: "True cost lands outside the first plan.",
          variant: "done",
        },
        {
          status: "Next",
          industry: "Your move",
          desc: "Without prior computation, you inherit the same curve.",
          variant: "next",
        },
      ],
      bottom: "Not luck. Repeated structure.",
      verdict: "See the map before execution.",
      cost: "If you do not compute, you pay in execution.",
    },
    complexity: {
      eyebrow: "Scale",
      headline: "Each layer adds variables. Human view does not.",
      items: [
        {
          num: "01",
          title: "More options",
          body: "More failure paths. Intuition chooses without closing accounts.",
        },
        {
          num: "02",
          title: "More speed",
          body: "Less margin to correct. Time works against you.",
        },
        {
          num: "03",
          title: "More exposure",
          body: "Cash and team stay coupled. Move one, move the other.",
        },
      ],
      bottomBig: "Intuition does not scale.",
      bottomAccent: "Computation does.",
    },
    outputs: {
      intro: "Outputs",
      headline: "What Aurora computes before you move weight.",
      desc: "No narrative. Only returned structure.",
      items: [
        {
          title: "What breaks",
          body: "The first node that takes the rest down if it fails. Visible before commitment.",
        },
        {
          title: "What activates",
          body: "Chains the move introduces without naming them.",
        },
        {
          title: "What depends",
          body: "Couplings between cash, operations, and team under the current decision.",
        },
        {
          title: "When it stops being reversible",
          body: "The point where walking it back no longer closes without new cost.",
        },
      ],
    },
    systemDef: [
      "Aurora does not predict. It exposes pressure.",
      "It does not recommend. It shows consequences.",
      "It does not interpret. It computes.",
      "The computation executes.",
    ],
    inevitable: {
      eyebrow: "Standard",
      headline: "This is not an improvement. It is the new standard.",
      lead: "Execution without structural computation becomes the normative risk.",
      stairs: [
        { year: "Now", label: "Pre-simulation", note: "Map before weight." },
        { year: "Then", label: "Bounded execution", note: "Only what closed." },
        { year: "After", label: "Clear debit", note: "No reading surprise." },
      ],
      coda: "Whoever executes without the map assumes the full cost.",
    },
    gateway: {
      kicker: "Now",
      h1: "Put it through.",
      sub: "Compute first.",
      cta: "Send to computation →",
      aside: "No account · Computation only.",
    },
    contact: {
      placeholder: "Describe the move (decision, hypothesis, bet).",
      emailPlaceholder: "Email (optional)",
    },
    footer: {
      descriptor: "",
      nav: [
        { label: "Home", href: "home" },
        { label: "Demo", href: "demo" },
      ],
      copyright: "© 2026 Aurora",
    },
  },
};

export function getHomeHref(locale: Locale): string {
  return locale === "en" ? "/en" : "/";
}

export function getDemoHref(locale: Locale): string {
  return locale === "en" ? "/en/demo" : "/demo";
}
