// Aurora Demo Engine v1.1
// Deterministic modular analysis engine.
// No API. No advice. Aurora reveals structure.

export interface DemoOutput {
  forma: string;
  exposicion: string;
  presion: string;
  posicion: string;
  ventana: string;
}

type Dimension =
  | "price"
  | "expansion"
  | "capital"
  | "structure"
  | "cost"
  | "product"
  | "channel"
  | "fallback";

// ---------------------------------------------------------------------------
// Keyword scoring
// ---------------------------------------------------------------------------

const KEYWORDS: Record<string, readonly string[]> = {
  expansion: [
    "abrir", "expandir", "expansión", "expansion", "mercado", "sucursal",
    "sede", "escalar", "crecer", "crecimiento", "segunda", "tercer",
    "internacionalizar", "punto de venta", "nueva oficina", "cobertura",
    "apertura", "geograf",
  ],
  price: [
    "precio", "cobr", "tarif", "margen", "comercial", "contrato",
    "pricing", "descuento", "oferta", "vend", "ventas", "cotiza",
    "factur", "ingreso", "revenue",
  ],
  capital: [
    "capital", "inversión", "inversion", "inversor", "funding", "financiar",
    "financiamiento", "deuda", "crédito", "credito", "socio", "fondo",
    "equity", "ronda", "levantar", "inyección", "inyeccion",
  ],
  structure: [
    "contratar", "contratación", "despedir", "equipo", "team", "hiring",
    "personal", "talento", "estructura", "reorganizar", "rol", "puesto",
    "incorporar", "incorporación", "headcount", "liderazgo", "gerente",
    "director", "ceo",
  ],
  cost: [
    "costo", "costos", "costes", "reducir", "recorte", "recortar",
    "eficiencia", "achicar", "cortar", "austeridad", "presupuesto",
    "overhead", "gasto", "gastar", "bajar costos", "ajuste de costo",
  ],
  product: [
    "producto", "feature", "funcionalidad", "lanzar", "lanzamiento",
    "desarrollar", "desarrollo", "mvp", "versión", "version", "release",
    "actualización", "roadmap", "construir", "build", "iterar",
  ],
  channel: [
    "canal", "marketing", "distribución", "distribucion", "publicidad",
    "ads", "campaña", "campana", "redes", "alcance", "leads",
    "adquisición", "adquisicion", "cac", "paid", "orgánico", "organico",
  ],
};

function dominantDimension(text: string): Dimension {
  const s = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [dim, words] of Object.entries(KEYWORDS)) {
    scores[dim] = 0;
    for (const kw of words) {
      if (s.includes(kw)) scores[dim]++;
    }
  }

  // Priority order for ties
  const order: Dimension[] = [
    "expansion", "price", "capital", "structure", "cost", "product", "channel",
  ];

  let best: Dimension = "fallback";
  let max = 0;
  for (const dim of order) {
    if ((scores[dim] ?? 0) > max) {
      max = scores[dim]!;
      best = dim;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Phrase pools
// ---------------------------------------------------------------------------

const PHRASES: Record<Dimension, Record<keyof DemoOutput, readonly string[]>> = {
  expansion: {
    forma: [
      "Movimiento expansivo dependiente de demanda temprana.",
      "Expansión de red con capital comprometido antes de generación local.",
      "Movimiento de cobertura: nueva posición antes de consolidar la actual.",
      "Expansión geográfica con fricción operativa en el tramo de rampa.",
    ],
    exposicion: [
      "Alta sensibilidad a ejecución temprana. El primer ciclo define la estructura de costo.",
      "Doble carga operativa durante la transición. La primera estructura sostiene la segunda.",
      "Exposición concentrada en el intervalo pre-generación. Capital sin retorno activo.",
      "Exposición directa a variación de demanda en el nuevo punto de operación.",
    ],
    presion: [
      "Presión sobre caja en el tramo de rampa. El ciclo nuevo no sostiene su costo todavía.",
      "Presión operativa creciente. Dos estructuras activas con un solo ritmo de cobro.",
      "Presión de coordinación: la expansión fragmenta foco antes de multiplicar resultado.",
      "Presión comercial temprana. La demanda no escala al mismo ritmo que la capacidad.",
    ],
    posicion: [
      "Posición sobreextendida hasta que el ciclo nuevo genere flujo propio.",
      "Posición estructural frágil en el tramo de transición.",
      "Posición condicionada al ritmo de adopción del nuevo mercado.",
      "Posición de doble compromiso: la salida limpia no está disponible durante el tramo inicial.",
    ],
    ventana: [
      "Ventana de entrada: 30–45 días. Después, el costo de la transición escala.",
      "Ventana determinada por el ciclo de cobro del punto nuevo. No por la decisión de abrir.",
      "Ventana corta de ajuste antes de que la estructura de costo se fije.",
      "Ventana abierta pero condicionada. La demanda inicial define si la posición es sostenible.",
    ],
  },

  price: {
    forma: [
      "Movimiento comercial. Cambio de velocidad en la relación precio-cobro.",
      "Movimiento de precio: ajuste en la variable que más señala valor percibido.",
      "Movimiento sobre margen: la decisión de precio redistribuye el equilibrio precio-volumen.",
      "Movimiento comercial con impacto directo en la percepción de valor del mercado.",
    ],
    exposicion: [
      "Exposición en el intervalo entre ajuste y respuesta del mercado. La reacción no es instantánea.",
      "Alta sensibilidad a la percepción del cliente durante el tramo de transición.",
      "Exposición directa a elasticidad de demanda. El volumen responde antes que el margen.",
      "Exposición al intervalo de señal: el mercado no integra el nuevo precio de inmediato.",
    ],
    presion: [
      "Presión sobre volumen. El margen depende de sostener velocidad de cierre durante el ajuste.",
      "Presión comercial temprana. El ajuste cambia el ritmo de decisión del cliente.",
      "Presión sobre retención. El precio nuevo redefine quién cierra y quién no.",
      "Presión de señal: el cambio de precio comunica antes de que la operación confirme.",
    ],
    posicion: [
      "Posición condicionada por cómo percibe el cliente el nuevo valor. No hay neutro.",
      "Posición competitiva abierta. El ajuste de precio expone la posición relativa al mercado.",
      "Posición de señal: el precio nuevo es una declaración antes de ser un resultado.",
      "Posición condicionada al ritmo de cierre. Si el volumen cae, el margen no sostiene.",
    ],
    ventana: [
      "Ventana calculada: 21–35 días para ejecutar sin pérdida de momentum comercial.",
      "Ventana de adopción: el mercado necesita ciclo completo para integrar el nuevo precio.",
      "Ventana corta de estabilización. El ajuste genera señal rápida de aceptación o rechazo.",
      "Ventana dependiente del ciclo de decisión del cliente. No del ritmo de la operación.",
    ],
  },

  capital: {
    forma: [
      "Forma dependiente de capital externo. El ciclo de decisión no es propio.",
      "Movimiento de capital: estructura de retorno activa antes de generación confirmada.",
      "Movimiento financiero con compromiso de resultado antes de ejecución completa.",
      "Ingreso de capital con obligación de demostración. El ritmo lo define el acuerdo.",
    ],
    exposicion: [
      "Dependencia de condiciones externas. El capital tiene estructura de retorno fija.",
      "Exposición al servicio del capital en escenarios de baja performance.",
      "Exposición doble: al resultado operativo y a las condiciones del acuerdo de capital.",
      "Alta sensibilidad a variación entre proyección y ejecución real.",
    ],
    presion: [
      "Presión financiera latente. El costo del capital es fijo independiente del resultado.",
      "Presión sobre la estructura de decisión. El capital externo no opera en tiempo operativo.",
      "Presión de demostración: el movimiento debe producir señal antes del próximo ciclo.",
      "Presión acumulada entre compromiso de retorno y generación real.",
    ],
    posicion: [
      "Posición dependiente de timing. La ventana de demostración es más corta que la de ejecución.",
      "Posición estructural condicionada al cumplimiento del acuerdo de capital.",
      "Posición de dependencia temporal. La autonomía se recupera al cerrar el ciclo.",
      "Posición abierta hacia el inversor. Las decisiones operativas tienen costo de aprobación.",
    ],
    ventana: [
      "Ventana de ejecución: 60–90 días para producir señal de retorno.",
      "Ventana determinada por el acuerdo, no por la operación.",
      "Ventana comprimida: el capital entra con expectativa de señal temprana.",
      "Ventana dependiente de condiciones externas. No se extiende sin renegociación.",
    ],
  },

  structure: {
    forma: [
      "Movimiento estructural apoyado en capacidad operativa.",
      "Movimiento de equipo: la estructura de ejecución cambia antes de que el resultado lo confirme.",
      "Movimiento de rediseño: nueva configuración operativa con fricción en el tramo de transición.",
      "Movimiento de capacidad: expansión o contracción del sistema humano que ejecuta.",
    ],
    exposicion: [
      "Exposición en el tramo de adaptación. Productividad real cae antes de recuperarse.",
      "Alta sensibilidad a la curva de adopción del nuevo esquema operativo.",
      "Exposición de coordinación: el cambio genera fricción antes de reducirla.",
      "Exposición doble: al costo del cambio y al costo de no haberlo anticipado.",
    ],
    presion: [
      "Presión sobre coordinación y foco. El sistema absorbe el cambio con fricción.",
      "Presión operativa durante la transición. Dos esquemas activos al mismo tiempo.",
      "Presión de rendimiento: el nuevo esquema tarda en producir al nivel del anterior.",
      "Presión sobre cultura operativa. El cambio redistribuye responsabilidad sin aviso.",
    ],
    posicion: [
      "Posición estructural incierta durante la transición.",
      "Posición de reorganización. Temporalmente más vulnerable hasta que el nuevo esquema opera.",
      "Posición condicionada por la velocidad de adopción del nuevo esquema.",
      "Posición de transición: la eficiencia cae antes de subir.",
    ],
    ventana: [
      "Ventana de absorción: 45–60 días. El rendimiento del cambio se mide pasado ese umbral.",
      "Ventana de transición determinada por la velocidad de adopción, no por la decisión.",
      "Ventana de adaptación corta si el cambio es reactivo. Más amplia si fue anticipado.",
      "Ventana abierta pero con costo creciente de permanencia en estado intermedio.",
    ],
  },

  cost: {
    forma: [
      "Movimiento de ajuste de costos. La estructura operativa se contrae antes de estabilizarse.",
      "Movimiento de reducción: cambio en la base de costo con impacto en capacidad operativa.",
      "Movimiento de contracción. El sistema opera con menos recursos antes de confirmar el equilibrio.",
      "Movimiento de eficiencia: ajuste en la relación entre gasto y resultado generado.",
    ],
    exposicion: [
      "Exposición en el tramo de ajuste. La capacidad operativa cae antes de que el costo baje.",
      "Alta sensibilidad a qué parte de la estructura soporta el recorte.",
      "Exposición al impacto en servicio. El recorte llega antes al cliente que al balance.",
      "Exposición de señal: el ajuste comunica al mercado y al equipo antes de producir resultado.",
    ],
    presion: [
      "Presión sobre entrega. La reducción de recursos tensiona la promesa operativa.",
      "Presión de moral operativa. El ajuste redistribuye carga antes de redistribuir beneficio.",
      "Presión sobre retención. El equipo lee el recorte como señal de dirección.",
      "Presión financiera a corto plazo aliviada, pero presión operativa concentrada.",
    ],
    posicion: [
      "Posición estructural comprimida. La operación tiene menos margen de respuesta.",
      "Posición de menor capacidad durante el tramo de ajuste.",
      "Posición defensiva activa. El movimiento prioriza estabilidad sobre capacidad.",
      "Posición condicionada: el recorte cierra opciones antes de abrir otras.",
    ],
    ventana: [
      "Ventana de estabilización: 30–60 días para confirmar que el nuevo nivel es sostenible.",
      "Ventana corta: si el ajuste es insuficiente, la presión reaparece antes del próximo ciclo.",
      "Ventana de adaptación interna más larga que la financiera.",
      "Ventana abierta pero inestable. El equilibrio nuevo tarda en validarse operativamente.",
    ],
  },

  product: {
    forma: [
      "Movimiento de producto. La apuesta es sobre adopción antes de que el mercado responda.",
      "Movimiento de lanzamiento: ejecución comprometida antes de validación de demanda.",
      "Movimiento de desarrollo: inversión de capacidad en construcción antes de generación.",
      "Movimiento de apuesta sobre señal: el producto se construye sobre una lectura de mercado no confirmada.",
    ],
    exposicion: [
      "Exposición directa a variación de demanda. El producto no tiene historia de adopción.",
      "Alta sensibilidad a timing de mercado. El lanzamiento en ventana incorrecta no se recupera fácil.",
      "Exposición al ciclo de retroalimentación largo. El mercado tarda en integrar el producto.",
      "Exposición al gap entre lo que el equipo construyó y lo que el mercado activa.",
    ],
    presion: [
      "Presión de adopción temprana. Sin señal inicial, el ciclo de priorización se acorta.",
      "Presión de ejecución: el producto debe ser suficientemente bueno antes de ser suficientemente usado.",
      "Presión de recursos: el desarrollo consume antes de que el producto retorne.",
      "Presión de ritmo: la velocidad de desarrollo define quién llega primero a la señal.",
    ],
    posicion: [
      "Posición dependiente de timing. El mercado define la ventana, no el equipo.",
      "Posición competitiva abierta. El producto nuevo expone la posición relativa al segmento.",
      "Posición de apuesta activa. El resultado no es controlable después del lanzamiento.",
      "Posición condicionada al ritmo de adopción. Sin tracción temprana, la posición se debilita.",
    ],
    ventana: [
      "Ventana de lanzamiento determinada por el ciclo del mercado, no por el roadmap.",
      "Ventana de adopción: 30–60 días para generar señal de tracción inicial.",
      "Ventana corta de validación. Pasado el umbral de adopción, el costo de corrección sube.",
      "Ventana abierta pero con costo creciente de cada iteración sin señal.",
    ],
  },

  channel: {
    forma: [
      "Movimiento de canal. La apuesta es sobre alcance antes de que la conversión lo confirme.",
      "Movimiento de distribución: nueva ruta al mercado con costo de activación antes de retorno.",
      "Movimiento de adquisición: inversión en acceso al cliente antes de confirmar el costo de conversión.",
      "Movimiento de marketing: cambio en la variable de acceso al mercado.",
    ],
    exposicion: [
      "Exposición directa a variación de conversión. El canal genera volumen antes de generar valor.",
      "Alta sensibilidad a la eficiencia del canal. El costo de adquisición no se conoce hasta ejecutar.",
      "Exposición al ciclo de atribución. El impacto real del canal tarda en leerse correctamente.",
      "Exposición a saturación temprana. El canal nuevo tiene eficiencia decreciente sin ajuste.",
    ],
    presion: [
      "Presión comercial temprana. El canal genera expectativa antes de generar resultado.",
      "Presión sobre conversión. El volumen de contacto no garantiza el volumen de cierre.",
      "Presión de CAC. Cada ciclo sin mejora de conversión eleva el costo de adquisición.",
      "Presión de ritmo: el canal requiere inversión continua para mantener la señal activa.",
    ],
    posicion: [
      "Posición competitiva abierta. El canal nuevo expone antes de proteger.",
      "Posición condicionada a la eficiencia del canal. Sin ajuste, la posición se degrada.",
      "Posición de dependencia. Si el canal falla, la generación de demanda queda sin alternativa.",
      "Posición estructural condicionada al costo de adquisición. El margen depende de él.",
    ],
    ventana: [
      "Ventana de calibración: 21–30 días para leer si el canal genera señal real.",
      "Ventana corta. Los canales digitales retroalimentan rápido, pero también se saturan.",
      "Ventana abierta pero con costo creciente sin señal de conversión.",
      "Ventana determinada por el ciclo de campaña. No por el objetivo de negocio.",
    ],
  },

  fallback: {
    forma: [
      "Movimiento detectado. Estructura de cambio con recursos comprometidos antes del cierre.",
      "Movimiento de transición. La estructura actual se mueve antes de que la nueva esté confirmada.",
      "Movimiento complejo. Múltiples dimensiones activas sin una dominante clara.",
    ],
    exposicion: [
      "Exposición en el intervalo entre decisión y resultado. El sistema no absorbe errores sin costo.",
      "Alta sensibilidad al intervalo de ejecución. El margen de error no está delimitado.",
      "Exposición distribuida en múltiples frentes activos simultáneamente.",
    ],
    presion: [
      "Presión operativa concentrada en el tramo más cercano a la ejecución. No hay margen neutro.",
      "Presión acumulada en el tramo de transición. El sistema opera en dos estados al mismo tiempo.",
      "Presión difusa. Sin dimensión dominante, la fricción se distribuye sin concentrarse.",
    ],
    posicion: [
      "Posición de tránsito. El movimiento fuerza una nueva estructura antes de confirmar el destino.",
      "Posición incierta. La dirección es clara pero el costo de llegada no está calculado.",
      "Posición abierta en múltiples frentes. La exposición no está concentrada.",
    ],
    ventana: [
      "Ventana calculada: 30–45 días. Pasado ese punto, el costo de no actuar supera el costo de actuar.",
      "Ventana no definida con precisión. La señal que la cierra no es obvia desde el inicio.",
      "Ventana dependiente de la dimensión que termine dominando la ejecución.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Deterministic phrase selection
// ---------------------------------------------------------------------------

function pick(pool: readonly string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(h) % pool.length]!;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function analyzeMovement(text: string): DemoOutput {
  const dim = dominantDimension(text);
  const pool = PHRASES[dim];
  // Use text + field name as seed so each field varies independently
  return {
    forma:      pick(pool.forma,      text + "forma"),
    exposicion: pick(pool.exposicion, text + "exposicion"),
    presion:    pick(pool.presion,    text + "presion"),
    posicion:   pick(pool.posicion,   text + "posicion"),
    ventana:    pick(pool.ventana,    text + "ventana"),
  };
}
