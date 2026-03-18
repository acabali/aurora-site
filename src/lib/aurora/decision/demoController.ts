import { submitAuroraDecision, toAuroraDecisionError } from "./adapter";
import { generateCreatives } from "../integrations/pencil";
import {
  DECISION_ABSORPTION_LABEL,
  DECISION_RISK_LEVEL_LABEL,
  DECISION_REVERSIBILITY_LABEL,
  DEFAULT_DECISION_REQUEST,
  mapLegacyRequestToCanon,
  type AuroraDecisionRequest,
  type DecisionCreative,
  type AuroraDecisionResponse,
  type DemoViewState,
} from "./types";

function formatCapital(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toFormRequest(form: HTMLFormElement): AuroraDecisionRequest {
  const formData = new FormData(form);
  const capital = Number(formData.get("capital") ?? DEFAULT_DECISION_REQUEST.capital);
  const protocol = String(formData.get("protocol") ?? DEFAULT_DECISION_REQUEST.protocol);

  return {
    capital,
    absorption: String(formData.get("absorption") ?? DEFAULT_DECISION_REQUEST.absorption) as AuroraDecisionRequest["absorption"],
    reversibility: String(formData.get("reversibility") ?? DEFAULT_DECISION_REQUEST.reversibility) as AuroraDecisionRequest["reversibility"],
    protocol: protocol === "vΩ" ? "vΩ" : DEFAULT_DECISION_REQUEST.protocol,
  };
}

function validateRequest(request: AuroraDecisionRequest): string | null {
  if (!Number.isFinite(request.capital) || request.capital < 0) {
    return "El capital debe ser un numero mayor o igual a cero.";
  }

  if (!["yes", "restricted", "no"].includes(request.absorption)) {
    return "La absorcion debe seguir el enum canónico.";
  }

  if (!["full", "partial", "none"].includes(request.reversibility)) {
    return "La reversibilidad debe seguir el enum canónico.";
  }

  if (request.protocol !== "vΩ") {
    return "El protocolo canónico requerido es vΩ.";
  }

  return null;
}

function setText(root: ParentNode, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function renderTerminal(root: ParentNode, lines: string[]): void {
  const list = root.querySelector<HTMLElement>("[data-demo-terminal]");

  if (!list) {
    return;
  }

  list.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    }),
  );
}

function setRowVisibility(root: ParentNode, selector: string, visible: boolean): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.hidden = !visible;
  }
}

function renderDataPoint(root: ParentNode, selector: string, label: string, value?: string | number): void {
  const element = root.querySelector<HTMLElement>(selector);
  const hasValue = value !== undefined && value !== null && String(value).trim().length > 0;

  if (!element) {
    return;
  }

  element.hidden = !hasValue;

  if (hasValue) {
    element.textContent = `${label}: ${value}`;
  }
}

function renderCreatives(root: ParentNode, creatives: DecisionCreative[]): void {
  const container = root.querySelector<HTMLElement>("[data-demo-creatives]");
  const list = root.querySelector<HTMLElement>("[data-demo-creatives-list]");

  if (!container || !list) {
    return;
  }

  container.hidden = creatives.length === 0;

  if (creatives.length === 0) {
    list.replaceChildren();
    return;
  }

  list.replaceChildren(
    ...creatives.slice(0, 2).map((creative) => {
      const item = document.createElement("li");
      item.className = "decision-output__creative-item";

      const hook = document.createElement("strong");
      hook.className = "decision-output__creative-hook";
      hook.textContent = creative.hook;

      const angle = document.createElement("span");
      angle.className = "decision-output__creative-angle";
      angle.textContent = creative.angle;

      item.append(hook, angle);
      return item;
    }),
  );
}

function terminalLines(data: AuroraDecisionResponse): string[] {
  const lines = [
    `risk_level: ${data.risk_level}`,
    `insight: ${data.insight}`,
    `counterfactual: ${data.counterfactual}`,
    `decision_id: ${data.decision_id}`,
    `decision_hash: ${data.decision_hash}`,
  ];

  if (typeof data.pressure_score === "number") {
    lines.push(`pressure_score: ${data.pressure_score}`);
  }

  if (typeof data.pressure_day === "number") {
    lines.push(`pressure_day: ${data.pressure_day}`);
  }

  if (data.structural_load) {
    lines.push(`structural_load: ${data.structural_load}`);
  }

  return lines;
}

function renderState(root: HTMLElement, state: DemoViewState): void {
  root.dataset.status = state.status;

  const form = root.querySelector<HTMLElement>("[data-demo-form]");
  const statusEl = root.querySelector<HTMLElement>("[data-demo-status-label]");
  const summaryEl = root.querySelector<HTMLElement>("[data-demo-summary]");
  const primaryEl = root.querySelector<HTMLElement>("[data-demo-primary]");
  const secondaryEl = root.querySelector<HTMLElement>("[data-demo-secondary]");
  const errorEl = root.querySelector<HTMLElement>("[data-demo-error]");
  const retryButton = root.querySelector<HTMLButtonElement>("[data-demo-retry]");
  const traceEl = root.querySelector<HTMLElement>("[data-demo-trace]");

  if (!form || !statusEl || !summaryEl || !primaryEl || !secondaryEl || !errorEl || !retryButton || !traceEl) {
    return;
  }

  form.hidden = state.status === "loading";

  if (state.status === "loading") {
    statusEl.textContent = "cargando";
    summaryEl.textContent = "secuencia de carga activa";
    primaryEl.textContent = "movimiento registrado";
    secondaryEl.textContent = "esperando respuesta canónica del motor";
    errorEl.textContent = "";
    retryButton.hidden = true;
    setRowVisibility(root, "[data-demo-metrics]", false);
    setRowVisibility(root, "[data-demo-creatives]", false);
    renderTerminal(root, [
      "POST /api/decision",
      `capital: ${state.request.capital}`,
      `absorción: ${state.request.absorption}`,
      `reversibilidad: ${state.request.reversibility}`,
      "protocolo: vΩ",
    ]);
    traceEl.textContent = `${formatCapital(state.request.capital)} · ${DECISION_ABSORPTION_LABEL[state.request.absorption]} · ${DECISION_REVERSIBILITY_LABEL[state.request.reversibility]}`;
    return;
  }

  if (state.status === "idle") {
    statusEl.textContent = "listo";
    summaryEl.textContent = "formulario visible, sin solicitud en curso";
    primaryEl.textContent = "capital, absorción y reversibilidad se mapean a la solicitud canónica.";
    secondaryEl.textContent = "el demo no calcula localmente ni completa datos fuera del motor.";
    errorEl.textContent = "";
    retryButton.hidden = true;
    setRowVisibility(root, "[data-demo-metrics]", false);
    setRowVisibility(root, "[data-demo-creatives]", false);
    renderTerminal(root, [
      "forma de la solicitud",
      "capital: number",
      "absorción: yes | restricted | no",
      "reversibilidad: full | partial | none",
      "protocolo: vΩ",
    ]);
    traceEl.textContent = `${formatCapital(state.request.capital)} · ${DECISION_ABSORPTION_LABEL[state.request.absorption]} · ${DECISION_REVERSIBILITY_LABEL[state.request.reversibility]}`;
    return;
  }

  if (state.status === "error" || !state.result) {
    statusEl.textContent = "error";
    summaryEl.textContent = "sistema no disponible";
    primaryEl.textContent = "cualquier error o latencia mayor al máximo deja el sistema fuera de servicio.";
    secondaryEl.textContent = "nunca calcular localmente, nunca mostrar datos parciales, nunca simular.";
    errorEl.textContent = "sistema no disponible";
    retryButton.hidden = false;
    setRowVisibility(root, "[data-demo-metrics]", false);
    setRowVisibility(root, "[data-demo-creatives]", false);
    renderTerminal(root, [
      "error: sistema no disponible",
      `code: ${state.error?.code ?? "unknown"}`,
      `status: ${state.error?.status ?? "--"}`,
      "action: retry",
    ]);
    traceEl.textContent = `${formatCapital(state.request.capital)} · ${DECISION_ABSORPTION_LABEL[state.request.absorption]} · ${DECISION_REVERSIBILITY_LABEL[state.request.reversibility]}`;
    return;
  }

  const { data } = state.result;

  statusEl.textContent = "resultado";
  summaryEl.textContent = "resultado renderizado desde la respuesta";
  primaryEl.textContent = data.insight;
  secondaryEl.textContent = data.counterfactual;
  errorEl.textContent = "";
  retryButton.hidden = false;
  setRowVisibility(root, "[data-demo-metrics]", Boolean(
    typeof data.pressure_score === "number" ||
      typeof data.pressure_day === "number" ||
      data.structural_load,
  ));
  renderDataPoint(root, "[data-demo-pressure-score]", "Puntaje de presión", data.pressure_score);
  renderDataPoint(root, "[data-demo-pressure-day]", "Día de presión", data.pressure_day);
  renderDataPoint(root, "[data-demo-structural-load]", "Carga estructural", data.structural_load);
  renderCreatives(root, state.result.creatives ?? []);
  renderTerminal(root, terminalLines(data));
  traceEl.textContent = `${DECISION_RISK_LEVEL_LABEL[data.risk_level]} · ${data.decision_id} · ${data.decision_hash}`;
}

export function mountDecisionDemo(): void {
  const root = document.querySelector<HTMLElement>("[data-decision-demo]");
  const form = document.querySelector<HTMLFormElement>("[data-demo-form]");
  const submitButton = form?.querySelector<HTMLButtonElement>('[type="submit"]');
  const retryButton = root?.querySelector<HTMLButtonElement>("[data-demo-retry]");

  if (!root || !form || !submitButton || !retryButton) {
    return;
  }

  let lastRequest = toFormRequest(form);

  async function runDecision(request: AuroraDecisionRequest): Promise<void> {
    const validationError = validateRequest(request);

    if (validationError) {
      renderState(root, {
        status: "error",
        request,
        result: null,
        error: {
          code: "validation",
          message: validationError,
          retriable: false,
        },
      });
      return;
    }

    submitButton.disabled = true;
    retryButton.disabled = true;
    renderState(root, {
      status: "loading",
      request,
      result: null,
      error: null,
    });

    try {
      const canonicalRequest = mapLegacyRequestToCanon(request);
      const result = await submitAuroraDecision(canonicalRequest);
      let creatives: DecisionCreative[] = [];

      try {
        const creativeResult = await generateCreatives({
          category: canonicalRequest.category,
          industry: canonicalRequest.industry,
          risk_level: result.data.risk_level,
        });
        creatives = creativeResult.variants;
      } catch {
        creatives = [];
      }

      renderState(root, {
        status: "success",
        request,
        result: {
          ...result,
          creatives,
        },
        error: null,
      });
    } catch (error) {
      renderState(root, {
        status: "error",
        request,
        result: null,
        error: toAuroraDecisionError(error).toJSON(),
      });
    } finally {
      submitButton.disabled = false;
      retryButton.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    lastRequest = toFormRequest(form);
    void runDecision(lastRequest);
  });

  retryButton.addEventListener("click", () => {
    void runDecision(lastRequest);
  });

  renderState(root, {
    status: "idle",
    request: lastRequest,
    result: null,
    error: null,
  });
}
