type PencilInput = {
  category?: string;
  industry?: string;
  risk_level?: string;
};

type PencilOutput = {
  variants: { hook: string; angle: string }[];
};

export async function generateCreatives(input: PencilInput): Promise<PencilOutput> {
  const base = {
    hook: "Reducí CAC sin aumentar riesgo",
    angle: "risk-first",
  };

  if (input?.risk_level === "RIESGO_CRITICO") {
    return {
      variants: [
        { hook: "Frená pérdidas antes de escalar", angle: "risk-control" },
        { hook: "Protegé caja antes de invertir más", angle: "cash-protection" },
      ],
    };
  }

  if (input?.risk_level === "RIESGO_CONTROLADO") {
    return {
      variants: [
        { hook: "Escalá con control de riesgo", angle: "controlled-growth" },
        { hook: "Optimización sin comprometer margen", angle: "efficiency" },
      ],
    };
  }

  return {
    variants: [
      base,
      { hook: "Escalá sin comprometer caja", angle: "cash-aware" },
    ],
  };
}
