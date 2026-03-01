export const home = {
  hero: {
    lineA: "La era de la evidencia comenzó.",
    lineB: "Antes decidías con experiencia. Hoy eso ya no alcanza.",
    cta: "Poner una decisión bajo evidencia",
    ctaHref: "/demo",
  },
  change: {
    title: "QUÉ ESTÁ CAMBIANDO",
    lead: "Una decisión ya no impacta una variable. Impacta un sistema completo.",
  },
  rupture: {
    title: "RUPTURA",
    line: "Ya no se corrige después. Se reordena antes.",
  },
  whatAurora: {
    title: "QUÉ HACE AURORA",
    blocks: [
      "No reemplaza criterio. Lo somete a evidencia.",
      "No acelera decisiones. Las reordena.",
      "No agrega herramientas. Eleva el estándar.",
    ],
  },
  capabilities: {
    title: "Capacidades bajo estándar",
    groups: [
      {
        key: "motor",
        title: "MOTOR ESTRUCTURAL",
        items: [
          { key: "core", name: "Core", detail: "Te ordena el problema y te muestra qué manda." },
          {
            key: "scenario",
            name: "Scenario",
            detail: "Te compara escenarios y te muestra qué cambia el resultado.",
          },
          {
            key: "risk",
            name: "Risk",
            detail: "Te marca dónde se concentra el riesgo y dónde se rompe.",
          },
          {
            key: "signal",
            name: "Signal",
            detail: "Te separa señal de ruido y te devuelve foco accionable.",
          },
          {
            key: "ledger",
            name: "Ledger",
            detail: "Te deja trazabilidad: qué decidiste, por qué y con qué evidencia.",
          },
          {
            key: "integration",
            name: "Integration",
            detail: "Te alinea equipos y decisiones para evitar contradicciones.",
          },
        ] as const,
      },
      {
        key: "applications",
        title: "APLICACIONES BAJO ESTÁNDAR",
        items: [
          {
            key: "growth",
            name: "Growth",
            detail: "Te escala con estructura, sin romper la operación.",
          },
          {
            key: "cost",
            name: "Cost",
            detail: "Te recorta fricción sin degradar capacidad.",
          },
          {
            key: "cash",
            name: "Cash",
            detail: "Te sincroniza caja con el ritmo real de ejecución.",
          },
          {
            key: "pricing",
            name: "Pricing",
            detail: "Te ajusta precio con elasticidad y margen reales.",
          },
          {
            key: "expansion",
            name: "Expansion",
            detail: "Te define entrada por umbral de evidencia.",
          },
        ] as const,
      },
    ] as const,
  },
  binary: {
    title: "Hay dos formas de operar.",
    before: "Operar como antes",
    after: "Reordenar bajo estándar actual",
  },
  demoCta: {
    title: "Estándar aplicado",
    lead: "Poner una decisión bajo evidencia.",
    cta: "Activar evaluación",
    ctaHref: "/demo",
    seal: "",
  },
} as const;
