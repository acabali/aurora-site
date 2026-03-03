export const home = {
  hero: {
    lineA: "La era de la evidencia comenzó.",
    lineB: "Aurora concentra ese entendimiento en un solo lugar, antes de que pongas un dólar en juego.",
    cta: "Ver cómo funciona",
    ctaHref: "/#productos",
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
          { key: "core", name: "Core", detail: "Detecta qué variable cambia el resultado." },
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
    cta: "Poner una decisión bajo evidencia",
    ctaHref: "/demo",
    seal: "",
  },
} as const;

export const home_narrativa_ajustada = {
  hero: {
    lines: [
      "El límite humano ya no alcanza.",
      "El mercado ya no compite con personas.",
      "Compite con sistemas.",
      "Quedarse en intuición",
      "es quedar fuera del juego real.",
      "Aurora no mejora decisiones.",
      "Desplaza el límite humano por el cálculo permanente.",
      "No es digitalización.",
      "Es sustitución operativa.",
    ],
    cta: "Poner una decisión bajo evidencia",
  },
  blocks: [
    {
      title: "QUÉ CAMBIÓ",
      lines: [
        "La forma de operar cambió.",
        "Validar antes de actuar ya es posible.",
        "La validación previa no es mejora.",
        "Es condición de entrada.",
        "La precisión no optimiza.",
        "Define quién compite.",
      ],
    },
    {
      title: "DESAJUSTE",
      lines: [
        "Hoy es más barato y más eficiente operar con capacidad algorítmica que con estructura inflada.",
        "La ventaja ya no está en crecer.",
        "Está en procesar mejor.",
        "Seguir expandiendo capas humanas",
        "cuando el cálculo ya es superior",
        "no es cultura.",
        "Es desventaja.",
        "El mercado premia cálculo.",
        "Penaliza interpretación.",
      ],
    },
    {
      title: "RUPTURA",
      lines: [
        "Antes:",
        "El error se absorbía.",
        "El ajuste era posterior.",
        "La velocidad era humana.",
        "Hoy:",
        "El mercado opera con sistemas autónomos.",
        "Automatización estratégica.",
        "Cálculo continuo.",
        "Antes se reaccionaba.",
        "Hoy se ejecuta con ventaja informacional.",
        "No es transformación digital.",
        "Es desplazamiento operativo.",
        "No es evolución.",
        "Es sustitución de estándar.",
      ],
    },
    {
      title: "QUÉ ES AURORA",
      lines: [
        "Aurora es una capa de cálculo soberano.",
        "No acompaña.",
        "Divide.",
        "Divide a quienes operan desde límite humano",
        "de quienes operan con potencia algorítmica.",
        "El entorno ya está gobernado por datos en tiempo real,",
        "automatización y modelos autónomos.",
        "Actuar solo con intuición",
        "no es identidad.",
        "Es inferioridad estructural.",
        "Cálculo soberano significa autonomía frente al error recurrente.",
        "Significa procesar complejidad sin reducirla.",
        "Significa tener ventaja antes de que el mercado entienda el movimiento.",
        "No es mejora.",
        "Es reemplazo.",
        "Con cálculo soberano, marcas el ritmo.",
        "Sin él, lo persigues.",
      ],
    },
    {
      title: "DEMO",
      lines: [
        "Pon tu próximo movimiento bajo evidencia.",
        "Aurora no opina.",
        "Calcula.",
        "Detecta la interacción dominante.",
        "Expone la vulnerabilidad central.",
        "Una señal.",
        "Un movimiento correcto.",
      ],
    },
  ],
} as const;
