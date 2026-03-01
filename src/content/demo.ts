export const demo = {
  context: {
    title: "Estándar aplicado.",
    subtitle:
      "Definí el contexto operativo de la decisión para iniciar la calibración bajo evidencia.",
    note: "La evaluación es única por dispositivo.",
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
    title: "Seleccioná la tensión dominante del sistema.",
    options: [
      {
        id: "cash-stress",
        title: "Inversión comercial con fricción de caja operativa.",
        hint: "La venta acelera, la liquidez no acompaña al mismo ritmo.",
      },
      {
        id: "cost-break",
        title: "Reducción de costo con degradación de servicio.",
        hint: "El ahorro inicial se traduce en retrabajo y pérdida de consistencia.",
      },
      {
        id: "automation-blind",
        title: "Automatización con pérdida de visibilidad crítica.",
        hint: "La operación fluye, las alertas llegan tarde.",
      },
      {
        id: "pricing-pace",
        title: "Ajuste de pricing con desalineación de cobranza.",
        hint: "El margen mejora en papel, el ciclo de efectivo se tensiona.",
      },
    ] as const,
  },
  signals: {
    title: "Indicá el comportamiento actual.",
    a: {
      label: "Señal A (demanda/cobro)",
      options: ["Cobro después de pagar", "Cobro antes de pagar"] as const,
    },
    b: {
      label: "Señal B (operación)",
      options: ["Se rompe calidad/tiempo", "Se rompe control/visibilidad"] as const,
    },
  },
  result: {
    title: "Resultado calibrado.",
    howTitle: "Rastro de evaluación",
    howLine1:
      "Cruce de contexto operativo con patrón de fricción entre cobros, pagos y ejecución.",
    howLine2:
      "Detección temprana de interacción crítica antes de materialización en caja.",
    cta: "Solicitar calibración completa",
    ctaUnavailable: "No disponible",
    ctaSub: "",
  },
  validation: {
    required: "Completá los campos obligatorios.",
    email: "Ingresá un email válido.",
    corporate: "Usá correo corporativo para habilitar devolución.",
    endpointMissing: "Endpoint no configurado",
  },
  analyzing: "Calibrando interacción...",
  continue: "Continuar",
  executed: {
    title: "Evaluación ya registrada.",
    sub: "Para una nueva calibración, contáctanos.",
  },
} as const;
