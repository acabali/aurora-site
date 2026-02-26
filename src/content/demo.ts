export const demo = {
  context: {
    title: "Antes de crecer más, mirá esto.",
    subtitle:
      "Aurora modela cómo se cruzan tus decisiones económicas reales. En minutos, te devuelve el punto ciego que suele aparecer después.",
    note: "Se puede usar una sola vez por dispositivo.",
    fields: {
      name: "Nombre",
      company: "Empresa",
      country: "País",
      industry: "Industria",
      size: "Tamaño",
      email: "Email corporativo",
    },
    countries: ["Argentina", "Chile", "Colombia", "México", "Perú", "España", "Otro"] as const,
    industries: ["Servicios", "Comercio", "Manufactura", "Tecnología", "Salud", "Otro"] as const,
    sizes: ["1–10", "11–50", "51–200", "200+"] as const,
  },
  scenario: {
    title: "Elegí el escenario que más se parece a tu situación.",
    options: [
      {
        id: "cash-stress",
        title: "Invertí para vender más y me faltó efectivo para sueldos, proveedores y gastos.",
        hint: "La venta sube, pero la caja se tensa antes de estabilizarse.",
      },
      {
        id: "cost-break",
        title: "Bajé costos y el servicio se me rompió en lo que el cliente sí nota.",
        hint: "El ahorro inicial termina en reclamos y retrabajo.",
      },
      {
        id: "automation-blind",
        title: "Automaticé y dejé de ver a tiempo los errores que cuestan plata.",
        hint: "El flujo sigue, pero las señales críticas llegan tarde.",
      },
      {
        id: "pricing-pace",
        title: "Ajusté precios y cambié el ritmo de cobro, pero los pagos no acompañaron.",
        hint: "El margen mejora en papel, pero la operación absorbe la fricción.",
      },
    ] as const,
  },
  signals: {
    title: "Marcá cómo se comporta hoy tu operación.",
    a: {
      label: "Señal A (demanda/cobro)",
      options: ["Cobro más tarde de lo que pago", "Cobro antes de lo que pago"] as const,
    },
    b: {
      label: "Señal B (operación)",
      options: ["Se rompe calidad/tiempo", "Se rompe control/visibilidad"] as const,
    },
  },
  result: {
    title: "Esto es lo que Aurora detecta primero.",
    howTitle: "Cómo lo hizo Aurora",
    howLine1:
      "Cruza tu contexto (país, industria, tamaño) con el patrón típico de fricción entre cobros, pagos y operación.",
    howLine2:
      "Cuando dos fuerzas se activan a la vez, Aurora marca dónde aparece el costo oculto antes de que se vea en caja.",
    cta: "Hablar con Aurora",
    ctaUnavailable: "No disponible",
    ctaSub: "Si querés que lo modelemos con tus datos reales, lo hacemos en una llamada.",
  },
  validation: {
    required: "Completá todos los campos obligatorios.",
    email: "Ingresá un email válido.",
    corporate: "Preferimos correo corporativo para devolver el análisis.",
    endpointMissing: "Endpoint no configurado",
  },
  analyzing: "Analizando interacción…",
  continue: "Continuar",
  executed: {
    title: "Ya analizaste una decisión.",
    sub: "Para evaluar otra, contáctanos.",
  },
} as const;
