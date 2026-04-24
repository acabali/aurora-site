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
      h1Line1: "Ya tomaste la decisión.",
      h1Line2: "No sabés cuánto te va a costar.",
      statementHtml:
        "Aurora calcula el impacto real de una decisión antes de que comprometas capital.<br/><br/><strong>No analiza lo que pasó. Interviene antes de que pase.</strong>",
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
      h1Line1: "You’ve already made the decision.",
      h1Line2: "You just don’t know what it costs yet.",
      statementHtml:
        "Aurora computes the real impact of a decision before you commit capital.<br/><br/><strong>It does not analyze the past. It intervenes before execution.</strong>",
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
