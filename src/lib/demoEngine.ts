// Aurora Demo Engine v2.1
// Structural evaluation engine. Deterministic. No advice. Aurora reveals structure.

export type Reversibility = "reversible" | "partially-locked" | "irreversible";
export type Resource      = "capital" | "headcount" | "attention" | "time" | "position";
export type Horizon       = "under-90" | "90-365" | "beyond-1y";

export type Domain =
  | "market_expansion"
  | "capital_allocation"
  | "hiring_organizational"
  | "product_launch"
  | "partnership_channel"
  | "pricing_move"
  | "operational_change"
  | "strategic_positioning";

export interface DemoInput {
  text:          string;
  reversibility: Reversibility;
  resource:      Resource;
  horizon:       Horizon;
}

// Internal structural variables
type Concentration = "low" | "medium" | "high";
type ExitGradient  = "low" | "medium" | "high" | "extreme";
type Inertia       = "low" | "medium" | "high";
type FRadius       = "minimal" | "medium" | "large";

interface StructuralVars {
  exposure_concentration: Concentration;
  exit_cost_gradient:     ExitGradient;
  commitment_inertia:     Inertia;
  foreclosure_radius:     FRadius;
}

export interface StructuralFingerprint {
  code:    string;
  summary: string;
}

export interface ExposureGeometry {
  shape:               "spiked" | "distributed" | "flat";
  dominant_exposure:   string;
  secondary_exposures: string[];
}

export interface ReversalProfile {
  earliest_clean_exit:   string;
  cost_inflection_point: string;
  structural_lock_in:    string;
}

export interface PositionalForeclosure {
  closed_positions: string[];
  open_position:    string;
}

export interface DemoOutput {
  domain:                 Domain;
  cold_mirror:            string;
  structural_fingerprint: StructuralFingerprint;
  exposure_geometry:      ExposureGeometry;
  reversal_profile:       ReversalProfile;
  positional_foreclosure: PositionalForeclosure;
}

// ---------------------------------------------------------------------------
// Domain detection
// ---------------------------------------------------------------------------

const DOMAIN_KW: Record<Domain, { p: string[]; s: string[] }> = {
  market_expansion: {
    p: ["expandir", "expansión", "expansion", "sucursal", "apertura", "nueva sede", "nueva ciudad", "internacionalizar", "nuevo mercado", "abrir tienda", "abrir local", "abrir oficina", "segunda sucursal", "tercer punto", "cobertura geográfica"],
    s: ["crecer", "crecimiento", "escalar", "alcance", "punto de venta", "segunda tienda"],
  },
  capital_allocation: {
    p: ["inversión", "inversion", "capital", "funding", "financiar", "financiamiento", "ronda", "equity", "deuda", "crédito", "credito", "inversor", "inversionista"],
    s: ["socio", "fondo", "levantar", "inyección", "inyeccion", "Serie A", "Serie B"],
  },
  hiring_organizational: {
    p: ["contratar", "contratación", "hiring", "headcount", "incorporar", "personal nuevo", "despedir", "reorganizar", "nuevo equipo", "estructura organizacional", "director", "gerente"],
    s: ["talento", "rol", "puesto", "liderazgo", "reportes", "organigrama"],
  },
  product_launch: {
    p: ["lanzar", "lanzamiento", "mvp", "producto nuevo", "feature", "release", "construir", "desarrollar producto", "nueva versión", "build"],
    s: ["roadmap", "funcionalidad", "iteración", "desarrollo", "sprint"],
  },
  partnership_channel: {
    p: ["canal", "distribución", "distribucion", "partner", "distribuidor", "alianza", "acuerdo comercial", "ads", "campaña publicitaria"],
    s: ["orgánico", "organico", "paid", "adquisición", "adquisicion", "cac", "marketing"],
  },
  pricing_move: {
    p: ["precio", "tarifa", "cobrar", "cobro", "margen", "pricing", "ajuste de precio", "subir precio", "bajar precio", "nueva tarifa"],
    s: ["descuento", "oferta", "ingreso", "revenue", "cotización", "facturación"],
  },
  operational_change: {
    p: ["proceso", "operación", "operaciones", "eficiencia", "reducir costos", "costos", "overhead", "achicar", "recortar", "recorte", "reestructura", "reconfigurar"],
    s: ["presupuesto", "gasto", "ajuste operativo", "optimizar", "bajar costos"],
  },
  strategic_positioning: {
    p: ["posicionamiento", "estrategia", "competencia", "diferenciación", "diferenciacion", "reposicionar", "pivote", "pivot", "propuesta de valor", "marca"],
    s: ["segmento", "nicho", "competidor", "ventaja", "imagen"],
  },
};

function detectDomain(text: string): Domain {
  const s = text.toLowerCase();
  let best: Domain = "strategic_positioning";
  let max = 0;

  for (const [domain, kw] of Object.entries(DOMAIN_KW) as [Domain, { p: string[]; s: string[] }][]) {
    let score = 0;
    for (const kw_p of kw.p) if (s.includes(kw_p)) score += 2;
    for (const kw_s of kw.s) if (s.includes(kw_s)) score += 1;
    if (score > max) { max = score; best = domain; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Cold mirror
// ---------------------------------------------------------------------------

const COLD_RESOURCE: Record<Resource, string> = {
  capital:   "Este movimiento compromete estructura financiera",
  headcount: "Este movimiento compromete capacidad organizacional",
  attention: "Este movimiento compromete ancho de banda interpretativo y ejecutivo",
  time:      "Este movimiento consume tiempo estructural —un recurso irrecuperable—",
  position:  "Este movimiento ocupa una posición estructural en el entorno",
};

const COLD_DOMAIN: Record<Domain, string> = {
  market_expansion:      "en una apuesta de cobertura geográfica sobre demanda no confirmada",
  capital_allocation:    "en una estructura de capital con ciclo de retorno activo",
  hiring_organizational: "en una reconfiguración del sistema organizacional antes de que el nuevo esquema opere",
  product_launch:        "en un lanzamiento de producto antes de retroalimentación validada del mercado",
  partnership_channel:   "en una apertura de canal externo con estructura de dependencia",
  pricing_move:          "en un reajuste de la señal precio-valor ante el mercado activo",
  operational_change:    "en una reconfiguración de la base operativa antes de confirmar el nuevo equilibrio",
  strategic_positioning: "en un movimiento de reposicionamiento en el entorno competitivo activo",
};

const COLD_REV: Record<Reversibility, string> = {
  irreversible:       "que no puede abandonarse sin generar obligaciones estructurales descendentes.",
  "partially-locked": "antes de que esté disponible la retroalimentación estructural necesaria para validar el compromiso.",
  reversible:         "mientras la opcionalidad estructural en posiciones adyacentes se preserva por ahora.",
};

function buildColdMirror(input: DemoInput, domain: Domain): string {
  return `${COLD_RESOURCE[input.resource]} ${COLD_DOMAIN[domain]} ${COLD_REV[input.reversibility]}`;
}

// ---------------------------------------------------------------------------
// Structural fingerprint
// ---------------------------------------------------------------------------

function buildFingerprint(vars: StructuralVars): StructuralFingerprint {
  const lv: Record<"low" | "medium" | "high", string> = { low: "L", medium: "M", high: "H" };
  const E = lv[vars.exposure_concentration];
  const I = lv[vars.commitment_inertia];
  const G = vars.exit_cost_gradient === "extreme" ? "H" : lv[vars.exit_cost_gradient as "low" | "medium" | "high"];
  const F = { minimal: "L", medium: "M", large: "H" }[vars.foreclosure_radius];
  const code = `${E}-${I}-${G}-${F}`;

  const parts: string[] = [];

  if (vars.exposure_concentration === "high")        parts.push("Concentración de exposición elevada");
  else if (vars.exposure_concentration === "low")    parts.push("Exposición distribuida");
  else                                               parts.push("Exposición moderada");

  if (vars.exit_cost_gradient === "extreme")         parts.push("gradiente de salida extremo");
  else if (vars.exit_cost_gradient === "high")       parts.push("gradiente de salida elevado");
  else if (vars.exit_cost_gradient === "low")        parts.push("gradiente de salida bajo");

  if (vars.commitment_inertia === "high")            parts.push("inercia de compromiso alta");
  else if (vars.commitment_inertia === "low")        parts.push("inercia baja");

  if (vars.foreclosure_radius === "large")           parts.push("clausura posicional amplia");
  else if (vars.foreclosure_radius === "minimal")    parts.push("clausura acotada");

  if (parts.length < 2) parts.push("perfil estructural moderado");

  return { code, summary: parts.join(". ") + "." };
}

// ---------------------------------------------------------------------------
// Stage B — Structural derivation (scoring system)
// ---------------------------------------------------------------------------

function deriveVars(input: DemoInput): StructuralVars {
  let ec: number, eg: number, ci: number, fr: number;

  switch (input.reversibility) {
    case "irreversible":     ec = 2; eg = 2; ci = 2; fr = 2; break;
    case "partially-locked": ec = 1; eg = 1; ci = 1; fr = 1; break;
    default:                 ec = 0; eg = 0; ci = 0; fr = 0;
  }

  switch (input.resource) {
    case "capital":
      ec = Math.min(2, ec + 1); eg = Math.min(3, eg + 1); fr = 2; break;
    case "headcount":
      ci = 2; ec = Math.max(ec, 1); fr = Math.max(fr, 1); break;
    case "attention":
      ci = Math.max(0, ci - 1); eg = Math.max(0, eg - 1); fr = Math.max(0, fr - 1); break;
    case "time":
      eg = Math.max(eg, 1); ci = Math.max(ci, 1); fr = Math.max(fr, 1); break;
    case "position":
      ci = 2; fr = 2; ec = Math.max(ec, 1); break;
  }

  switch (input.horizon) {
    case "under-90":   eg = Math.min(3, eg + 1); fr = Math.max(0, fr - 1); break;
    case "beyond-1y":  ci = Math.max(ci, 2); fr = 2; eg = Math.max(eg, 1); break;
  }

  if (input.reversibility === "irreversible" && input.resource === "capital"   && input.horizon === "under-90")   { ec = 2; eg = 3; }
  if (input.reversibility === "irreversible" && input.resource === "headcount" && input.horizon === "beyond-1y")  { ci = 2; fr = 2; }
  if (input.reversibility === "reversible"   && input.resource === "attention" && input.horizon === "under-90")   { ec = 0; eg = 0; ci = 0; fr = 0; }

  const concentrations: Concentration[] = ["low", "medium", "high"];
  const gradients: ExitGradient[]       = ["low", "medium", "high", "extreme"];
  const inertias: Inertia[]             = ["low", "medium", "high"];
  const radii: FRadius[]                = ["minimal", "medium", "large"];

  return {
    exposure_concentration: concentrations[Math.max(0, Math.min(2, ec))]!,
    exit_cost_gradient:     gradients[Math.max(0, Math.min(3, eg))]!,
    commitment_inertia:     inertias[Math.max(0, Math.min(2, ci))]!,
    foreclosure_radius:     radii[Math.max(0, Math.min(2, fr))]!,
  };
}

// ---------------------------------------------------------------------------
// Stage C — Output generation (domain-modulated)
// ---------------------------------------------------------------------------

// Domain-specific dominant exposure (sparse; null → fall back to generic)
const DOMAIN_DOM: Partial<Record<Domain, Partial<Record<Resource, { high: string; base: string }>>>> = {
  market_expansion: {
    capital:   { high: "Capital concentrado en apertura de posición geográfica. La demanda del nuevo punto no está confirmada.", base: "Capital desplegado en expansión geográfica antes de generación local confirmada." },
    headcount: { high: "Capacidad organizacional extendida sobre dos geografías activas. La estructura humana sostiene doble carga.", base: "Capacidad organizacional extendida sobre apertura geográfica antes de confirmar demanda local." },
    time:      { high: "Horizonte temporal comprometido en rampa de apertura. El tiempo no está disponible para corrección paralela.", base: "Tiempo estructural comprometido en ciclo de apertura y rampa geográfica." },
  },
  capital_allocation: {
    capital:   { high: "Concentración máxima en estructura de capital. El ciclo de retorno activo define el vector de exposición.", base: "Exposición directa al ciclo de retorno del capital antes de confirmación de ejecución." },
  },
  hiring_organizational: {
    headcount: { high: "Reconfiguración organizacional con alta inercia. El nuevo esquema de equipo no opera antes del período de adaptación.", base: "La nueva configuración de equipo distribuye la exposición antes de confirmar productividad efectiva." },
    capital:   { high: "Capital concentrado en nueva estructura de equipo antes de confirmación de capacidad operativa.", base: "Capital comprometido en nuevo headcount antes de señal de productividad del equipo." },
  },
  product_launch: {
    capital:   { high: "Capital concentrado en lanzamiento antes de señal de adopción confirmada.", base: "Capital comprometido en ciclo de desarrollo y lanzamiento antes de retroalimentación del mercado." },
    headcount: { high: "Capacidad de equipo comprometida en lanzamiento. La inercia de desarrollo domina el vector de exposición.", base: "El equipo concentrado en construcción precede a la señal de adopción del mercado." },
    time:      { high: "Horizonte de desarrollo activo. El tiempo comprometido en lanzamiento no está disponible para corrección.", base: "Tiempo estructural comprometido en ciclo de construcción y activación del mercado." },
    attention: { high: "Foco comprometido en lanzamiento. Sin ancho de banda disponible para señales externas durante el ciclo.", base: "Atención comprometida en el ciclo de lanzamiento antes de retroalimentación externa." },
  },
  pricing_move: {
    capital:   { high: "Exposición concentrada al intervalo de transición. El margen comprometido precede a la confirmación de volumen.", base: "Exposición financiera al intervalo entre ajuste de precio y respuesta del mercado." },
    time:      { high: "Horizonte de transición de precio activo. El mercado integra el ajuste en su propio ciclo.", base: "Tiempo comprometido en el intervalo de señal-precio-respuesta del mercado." },
    position:  { high: "El ajuste de precio redefine la posición competitiva activa. La posición previa queda clausurada.", base: "El movimiento de precio ocupa posición de señal ante el mercado antes de confirmar respuesta." },
  },
  operational_change: {
    headcount: { high: "La reconfiguración operativa genera máxima inercia. El equipo absorbe el cambio antes de operar al nuevo nivel.", base: "El cambio operativo distribuye la fricción sobre el equipo antes de estabilizar el nuevo esquema." },
    time:      { high: "Horizonte operativo en transición. El tiempo comprometido en reconfiguración no está disponible para movimientos paralelos.", base: "Tiempo estructural comprometido en el tramo de reconfiguración operativa." },
    capital:   { high: "Capital concentrado en reconfiguración operativa. El retorno no fluye hasta que el nuevo esquema se estabiliza.", base: "Capital invertido en reconfiguración antes de confirmar el nuevo equilibrio operativo." },
  },
  partnership_channel: {
    capital:   { high: "Capital concentrado en canal externo. El retorno depende de un tercero fuera del control operativo directo.", base: "Capital desplegado en canal cuyo rendimiento no está bajo control operativo directo." },
    time:      { high: "Tiempo comprometido en ciclo de activación de canal. El ritmo lo define el canal, no la operación.", base: "Horizonte comprometido en activación y calibración del canal externo." },
    attention: { high: "Atención comprometida en gestión de canal externo. La dependencia distribuye la exposición ejecutiva.", base: "Foco comprometido en coordinación de canal externo antes de confirmar eficiencia." },
  },
  strategic_positioning: {
    position:  { high: "El reposicionamiento redefine el perímetro competitivo activo. Las posiciones previas quedan clausuradas.", base: "El movimiento de posicionamiento ocupa una posición estructural que comprime opciones adyacentes." },
    capital:   { high: "Capital concentrado en reposicionamiento antes de confirmar ventaja diferencial.", base: "Capital comprometido en posicionamiento estratégico antes de validación de ventaja estructural." },
    attention: { high: "Foco estratégico comprometido en reposicionamiento. Sin ancho de banda disponible para ajustes paralelos.", base: "Atención comprometida entre reposicionamiento estratégico y operación activa." },
  },
};

// Domain-specific secondary exposure sentences (fills gap when secondaries < 2)
const DOMAIN_SEC: Record<Domain, string> = {
  market_expansion:      "La apertura geográfica requiere sostener dos estructuras operativas activas simultáneamente.",
  capital_allocation:    "El ciclo de retorno del capital opera con independencia de la performance operativa.",
  hiring_organizational: "La adaptación organizacional reduce la capacidad efectiva antes de recuperarla.",
  product_launch:        "La retroalimentación del mercado no responde al ritmo del roadmap interno.",
  partnership_channel:   "La dependencia del canal externo limita la velocidad de ajuste de ejecución.",
  pricing_move:          "El intervalo entre ajuste de precio y respuesta del mercado no es comprimible.",
  operational_change:    "La transición operativa genera un período de capacidad reducida antes del nuevo equilibrio.",
  strategic_positioning: "El nuevo posicionamiento activa señales competitivas antes de consolidar la posición.",
};

// Domain context appended to structural_lock_in when ci !== "low"
const DOMAIN_LOCKIN: Record<Domain, string> = {
  market_expansion:      "La rampa de apertura geográfica fija la inercia de compromiso.",
  capital_allocation:    "Las condiciones del acuerdo de capital aceleran la consolidación del bloqueo.",
  hiring_organizational: "El rediseño organizacional consolida el bloqueo antes de producir eficiencia.",
  product_launch:        "El ciclo de lanzamiento sostiene el bloqueo hasta la señal de retroalimentación.",
  partnership_channel:   "La dependencia del canal extiende el bloqueo más allá del ciclo operativo propio.",
  pricing_move:          "La señal de precio emitida sostiene el bloqueo hasta la respuesta del mercado.",
  operational_change:    "La reconfiguración operativa consolida el bloqueo durante la transición activa.",
  strategic_positioning: "El reposicionamiento activo mantiene el bloqueo hasta consolidar la nueva posición.",
};

// Domain-specific primary foreclosure lock (sparse; falls back to generic)
const DOMAIN_LOCK: Partial<Record<Domain, Partial<Record<Resource, string>>>> = {
  market_expansion: {
    capital:   "El capital desplegado en la nueva geografía clausura posiciones de inversión alternativas en el mismo período.",
    headcount: "El equipo asignado a la apertura clausura posiciones de reasignación hasta completar la rampa.",
    time:      "El horizonte comprometido en apertura clausura ventanas de movimiento en mercados paralelos.",
    position:  "La apertura geográfica clausura posiciones de ajuste o contracción en el perímetro de operación actual.",
  },
  capital_allocation: {
    capital:   "Las condiciones del acuerdo de capital clausuran posiciones de financiamiento alternativo en el horizonte activo.",
  },
  hiring_organizational: {
    headcount: "La nueva configuración organizacional clausura los esquemas y roles previos sin restauración inmediata posible.",
    capital:   "La inversión en reconfiguración de equipo clausura posiciones de reasignación presupuestaria hasta que el esquema opera.",
  },
  product_launch: {
    capital:   "El capital comprometido en lanzamiento clausura posiciones de inversión en otros productos durante el ciclo activo.",
    headcount: "La capacidad de equipo comprometida en desarrollo clausura posiciones de trabajo en iniciativas paralelas.",
    time:      "El horizonte de lanzamiento clausura ventanas de pivote hasta completar el ciclo de retroalimentación.",
    attention: "El foco comprometido en lanzamiento clausura la capacidad de respuesta ante señales externas prioritarias.",
  },
  pricing_move: {
    capital:   "El ajuste de margen clausura la posición de precio previa sin posibilidad de retorno silencioso.",
    position:  "La nueva posición de precio clausura la posición competitiva previa en el segmento activo.",
  },
  operational_change: {
    headcount: "El cambio operativo clausura la configuración de equipo previa antes de confirmar la nueva eficiencia.",
    capital:   "El capital comprometido en reconfiguración clausura inversiones alternativas durante la transición.",
    time:      "El horizonte de transición operativa clausura ventanas de movimiento estratégico paralelo.",
  },
  partnership_channel: {
    capital:   "El capital comprometido en el canal clausura posiciones de inversión en canales alternativos durante el ciclo.",
    time:      "El ciclo de activación del canal clausura el tiempo disponible para probar alternativas de distribución.",
    attention: "El foco de coordinación de canal clausura la capacidad de gestión de canales complementarios.",
  },
  strategic_positioning: {
    position:  "El nuevo posicionamiento clausura la posición competitiva previa en el segmento de mercado activo.",
    capital:   "El capital invertido en posicionamiento clausura posiciones de diferenciación alternativas en el mismo horizonte.",
    attention: "El foco en reposicionamiento clausura la capacidad interpretativa para señales operativas paralelas.",
  },
};

function buildExposureGeometry(vars: StructuralVars, input: DemoInput, domain: Domain): ExposureGeometry {
  const { exposure_concentration: ec, commitment_inertia: ci, foreclosure_radius: fr, exit_cost_gradient: eg } = vars;

  const shapeMap: Record<Concentration, ExposureGeometry["shape"]> = {
    low: "flat", medium: "distributed", high: "spiked",
  };
  const shape = shapeMap[ec];

  // Domain-modulated dominant exposure (falls back to generic)
  const domainDom = DOMAIN_DOM[domain]?.[input.resource];
  let dominant_exposure: string;

  if (domainDom) {
    dominant_exposure = ec === "high" ? domainDom.high : domainDom.base;
  } else if (input.resource === "capital" && ec === "high") {
    dominant_exposure = "Concentración en estructura financiera. El capital comprometido define el vector primario de exposición.";
  } else if (input.resource === "capital") {
    dominant_exposure = "Exposición en estructura financiera. Concentración moderada sobre el capital desplegado.";
  } else if (input.resource === "headcount" && ci === "high") {
    dominant_exposure = "Exposición concentrada en estructura organizacional. La inercia de headcount domina el vector.";
  } else if (input.resource === "headcount") {
    dominant_exposure = "Exposición organizacional distribuida. La estructura de equipo sostiene el vector primario.";
  } else if (input.resource === "position" && fr === "large") {
    dominant_exposure = "Clausura posicional como vector dominante. El movimiento redefine el perímetro estructural activo.";
  } else if (input.resource === "position") {
    dominant_exposure = "Exposición posicional. El movimiento comprime el espacio de posiciones adyacentes.";
  } else if (input.resource === "time") {
    dominant_exposure = "Bloqueo temporal como vector primario. El horizonte comprometido no está disponible para movimientos paralelos.";
  } else {
    dominant_exposure = ec === "low"
      ? "Exposición distribuida por dispersión de atención. Sin vector singular dominante."
      : "Exposición difusa. La atención comprometida genera presión estructural sin concentración clara.";
  }

  // Secondary exposures (severity-ordered, then domain fill)
  const secondaries: string[] = [];

  if (ci === "high"        && secondaries.length < 2) secondaries.push("La inercia de compromiso limita la velocidad de reversión.");
  if (ec === "high"        && secondaries.length < 2) secondaries.push("La concentración reduce la superficie de respuesta disponible.");
  if (fr === "large"       && secondaries.length < 2) secondaries.push("El radio de clausura se extiende sobre posiciones adyacentes.");
  if (eg === "extreme"     && secondaries.length < 2) secondaries.push("El gradiente de salida escala de forma no lineal dentro del horizonte.");
  if (fr === "minimal"     && secondaries.length < 2) secondaries.push("El movimiento no ejerce clausura sobre posiciones externas.");
  if (ec === "low"         && secondaries.length < 2) secondaries.push("La exposición permanece distribuida. No hay vector singular dominante.");
  if (ci === "low"         && secondaries.length < 2) secondaries.push("La inercia de compromiso permanece baja. La estructura no se consolida.");

  // Domain fills remaining slot
  if (secondaries.length < 2) secondaries.push(DOMAIN_SEC[domain]);

  if (secondaries.length === 0) secondaries.push("Estructura de exposición en estado intermedio. Sin concentración singular detectada.");

  return { shape, dominant_exposure, secondary_exposures: secondaries.slice(0, 2) };
}

function buildReversalProfile(vars: StructuralVars, input: DemoInput, domain: Domain): ReversalProfile {
  const { exit_cost_gradient: eg, commitment_inertia: ci } = vars;
  const h = input.horizon;

  const exitMap: Record<Horizon, Record<ExitGradient, string>> = {
    "under-90": {
      low:     "Disponible hasta el día 60 de la ventana de compromiso.",
      medium:  "Se comprime hacia el intervalo de los días 20–35.",
      high:    "Estrecha a los primeros 10–15 días tras la activación.",
      extreme: "Se cierra dentro de los primeros 7 días de activación del compromiso.",
    },
    "90-365": {
      low:     "Disponible durante los primeros 6 meses de la ventana.",
      medium:  "Se comprime hacia el tercer mes del período de compromiso.",
      high:    "Estrecha a las primeras 6–8 semanas de activación.",
      extreme: "Se cierra en las primeras 2–3 semanas tras la activación.",
    },
    "beyond-1y": {
      low:     "Disponible hasta el Q2 del horizonte de compromiso.",
      medium:  "Se comprime hacia el Q1–Q2 del horizonte.",
      high:    "Estrecha al primer trimestre de activación.",
      extreme: "Se cierra dentro de las primeras 6–8 semanas de activación.",
    },
  };

  const inflectionMap: Record<Horizon, Record<ExitGradient, string>> = {
    "under-90": {
      low:     "Sin inflexión significativa de costo dentro de la ventana.",
      medium:  "Inflexión visible alrededor del día 30–45.",
      high:    "Inflexión temprana. El costo de salida escala desde el día 15–20.",
      extreme: "Inflexión desde la activación. El gradiente de costo es máximo desde el inicio.",
    },
    "90-365": {
      low:     "Sin inflexión significativa durante los primeros 6 meses.",
      medium:  "Inflexión alrededor del mes 3–4 del período.",
      high:    "Inflexión temprana. Costo de salida escala desde la semana 6–8.",
      extreme: "Inflexión desde el inicio. El costo de salida no decrece dentro del período.",
    },
    "beyond-1y": {
      low:     "Sin inflexión de costo significativa durante los primeros 2 trimestres.",
      medium:  "Inflexión visible entre Q1–Q2 del horizonte.",
      high:    "Inflexión en Q1. El costo se consolida antes del segundo trimestre.",
      extreme: "Inflexión inmediata. El gradiente alcanza su máximo en las primeras semanas de activación.",
    },
  };

  const lockMap: Record<Horizon, Record<Inertia, string>> = {
    "under-90": {
      low:    "Sin bloqueo estructural significativo dentro del horizonte.",
      medium: "Bloqueo parcial visible alrededor del día 45–60.",
      high:   "Bloqueo estructural completo desde el día 20–30.",
    },
    "90-365": {
      low:    "Sin bloqueo estructural significativo en el horizonte activo.",
      medium: "Bloqueo parcial consolidado hacia el mes 4–5.",
      high:   "Bloqueo estructural completo consolidado en el mes 2–3.",
    },
    "beyond-1y": {
      low:    "Sin bloqueo estructural dentro del primer año.",
      medium: "Bloqueo parcial hacia el Q2 del horizonte.",
      high:   "Bloqueo estructural completo consolidado en Q1.",
    },
  };

  // Domain modulates lock-in when inertia is non-trivial
  const baseLockIn = lockMap[h][ci];
  const structural_lock_in = ci !== "low"
    ? `${baseLockIn} ${DOMAIN_LOCKIN[domain]}`
    : baseLockIn;

  return {
    earliest_clean_exit:   exitMap[h][eg],
    cost_inflection_point: inflectionMap[h][eg],
    structural_lock_in,
  };
}

function buildPositionalForeclosure(vars: StructuralVars, input: DemoInput, domain: Domain): PositionalForeclosure {
  const { foreclosure_radius: fr, commitment_inertia: ci } = vars;

  const genericPrimaryLock: Record<Resource, string> = {
    capital:   "Posiciones que requieren capital libre quedan estructuralmente bloqueadas.",
    headcount: "Posiciones que demandan reasignación organizacional quedan clausuradas.",
    time:      "Posiciones alternativas dentro del mismo horizonte temporal quedan comprimidas.",
    position:  "La reversión del movimiento genera dependencia estructural en posiciones adyacentes.",
    attention: "Las señales emitidas durante el compromiso limitan posiciones estratégicas previas.",
  };

  const secondaryLock = {
    inertia:     "El bloqueo de inercia clausura la disponibilidad de rediseño organizacional.",
    dependency:  "La dependencia estructural generada limita la renegociación en el horizonte activo.",
    signal:      "La señalización del movimiento restringe posiciones de reversión parcial.",
    interdepend: "La interdependencia estructural clausura posiciones de salida parcial dentro del horizonte.",
  };

  const openMap: Record<Resource, string> = {
    capital:   "La posición de negociación sobre condiciones de capital permanece abierta en el horizonte inmediato.",
    headcount: "La posición de ajuste incremental de capacidad permanece disponible antes del bloqueo de inercia.",
    attention: "La posición de reorientación de atención permanece ampliamente disponible.",
    time:      "La posición de aceleración dentro del horizonte activo permanece estructuralmente abierta.",
    position:  "La posición de redefinición del perímetro de influencia permanece abierta en el corto plazo.",
  };

  const count = fr === "minimal" ? 1 : fr === "medium" ? 2 : 3;

  // Primary: domain-specific or generic
  const primary = DOMAIN_LOCK[domain]?.[input.resource] ?? genericPrimaryLock[input.resource];
  const closed_positions: string[] = [primary];

  if (count >= 2) {
    if (ci === "high") closed_positions.push(secondaryLock.inertia);
    else if (input.reversibility === "irreversible") closed_positions.push(secondaryLock.dependency);
    else closed_positions.push(secondaryLock.signal);
  }

  if (count >= 3) {
    closed_positions.push(secondaryLock.interdepend);
  }

  const open_position = fr === "minimal"
    ? "El movimiento permanece estructuralmente contenido. Las posiciones adyacentes no están clausuradas."
    : openMap[input.resource];

  return { closed_positions, open_position };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function analyzeMovement(input: DemoInput): DemoOutput {
  const vars   = deriveVars(input);
  const domain = detectDomain(input.text);
  return {
    domain,
    cold_mirror:            buildColdMirror(input, domain),
    structural_fingerprint: buildFingerprint(vars),
    exposure_geometry:      buildExposureGeometry(vars, input, domain),
    reversal_profile:       buildReversalProfile(vars, input, domain),
    positional_foreclosure: buildPositionalForeclosure(vars, input, domain),
  };
}
