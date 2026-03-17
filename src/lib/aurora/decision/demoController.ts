import { submitAuroraDecision, toAuroraDecisionError } from "./adapter";
import {
  DECISION_CATEGORY_LABEL,
  DECISION_INDUSTRY_LABEL,
  DECISION_NATURE_LABEL,
  DECISION_REVERSIBILITY_LABEL,
  DECISION_RISK_LEVEL_LABEL,
  type AuroraDecisionRequest,
  type DemoViewState,
} from "./types";

function formatAmount(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toFormRequest(form: HTMLFormElement): AuroraDecisionRequest {
  const formData = new FormData(form);

  return {
    amount: Number(formData.get("amount") ?? 0),
    currency: "USD",
    cashCommitment30d: String(formData.get("cashCommitment30d") ?? "MEDIA") as AuroraDecisionRequest["cashCommitment30d"],
    nature: String(formData.get("nature") ?? "UNICO") as AuroraDecisionRequest["nature"],
    category: String(formData.get("category") ?? "VENTAS_CANALES") as AuroraDecisionRequest["category"],
    reversibility: String(formData.get("reversibility") ?? "MEDIA") as AuroraDecisionRequest["reversibility"],
    industry: String(formData.get("industry") ?? "SAAS") as AuroraDecisionRequest["industry"],
  };
}

function validateRequest(request: AuroraDecisionRequest): string | null {
  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    return "Ingresa un monto valido para someter el movimiento a calculo.";
  }

  return null;
}

function renderState(root: HTMLElement, state: DemoViewState): void {
  root.dataset.status = state.status;

  const statusEl = root.querySelector<HTMLElement>("[data-demo-status-label]");
  const summaryEl = root.querySelector<HTMLElement>("[data-demo-summary]");
  const insightEl = root.querySelector<HTMLElement>("[data-demo-insight]");
  const counterfactualEl = root.querySelector<HTMLElement>("[data-demo-counterfactual]");
  const decisionIdEl = root.querySelector<HTMLElement>("[data-demo-decision-id]");
  const decisionHashEl = root.querySelector<HTMLElement>("[data-demo-decision-hash]");
  const evidenceEl = root.querySelector<HTMLElement>("[data-demo-evidence]");
  const errorEl = root.querySelector<HTMLElement>("[data-demo-error]");
  const retryButton = root.querySelector<HTMLButtonElement>("[data-demo-retry]");
  const traceEl = root.querySelector<HTMLElement>("[data-demo-trace]");

  if (!statusEl || !summaryEl || !insightEl || !counterfactualEl || !decisionIdEl || !decisionHashEl || !evidenceEl || !errorEl || !retryButton || !traceEl) {
    return;
  }

  if (state.status === "loading") {
    statusEl.textContent = "Calculando movimiento";
    summaryEl.textContent = "Aurora esta evaluando la presion estructural antes de ejecutar.";
    insightEl.textContent = "Mapeando variables activas, caja comprometida y reversibilidad.";
    counterfactualEl.textContent = "Contrastando contrafactual operativo.";
    decisionIdEl.textContent = "decision_id: esperando";
    decisionHashEl.textContent = "decision_hash: esperando";
    evidenceEl.innerHTML = "<li>Recibiendo contrato de decision</li><li>Verificando estructura del movimiento</li><li>Esperando lectura del sistema</li>";
    errorEl.textContent = "";
    retryButton.disabled = true;
    retryButton.hidden = true;
    traceEl.textContent = `${formatAmount(state.request.amount)} · ${DECISION_CATEGORY_LABEL[state.request.category]} · ${DECISION_NATURE_LABEL[state.request.nature]}`;
    return;
  }

  if (state.status === "idle") {
    statusEl.textContent = "Listo para calcular";
    summaryEl.textContent = "La demo prepara el movimiento para el adapter único de Aurora.";
    insightEl.textContent = "Ingresa el movimiento y ejecuta el cálculo.";
    counterfactualEl.textContent = "El resultado devolverá insight, contrafactual y huella de decisión.";
    decisionIdEl.textContent = "decision_id: --";
    decisionHashEl.textContent = "decision_hash: --";
    evidenceEl.innerHTML = "";
    errorEl.textContent = "";
    retryButton.disabled = false;
    retryButton.hidden = true;
    traceEl.textContent = `${formatAmount(state.request.amount)} · ${DECISION_CATEGORY_LABEL[state.request.category]} · ${DECISION_NATURE_LABEL[state.request.nature]}`;
    return;
  }

  if (state.status === "error" || !state.result) {
    statusEl.textContent = "Calculo no disponible";
    summaryEl.textContent = "Aurora no pudo devolver una lectura valida para este intento.";
    insightEl.textContent = "Reintenta la conexion o ajusta el movimiento.";
    counterfactualEl.textContent = "El contrato del adapter sigue listo para reintento inmediato.";
    decisionIdEl.textContent = "decision_id: --";
    decisionHashEl.textContent = "decision_hash: --";
    evidenceEl.innerHTML = "";
    errorEl.textContent = state.error?.message ?? "No fue posible calcular el movimiento.";
    retryButton.disabled = false;
    retryButton.hidden = false;
    traceEl.textContent = `${DECISION_REVERSIBILITY_LABEL[state.request.reversibility]} · ${DECISION_INDUSTRY_LABEL[state.request.industry]}`;
    return;
  }

  const { data } = state.result;

  statusEl.textContent = DECISION_RISK_LEVEL_LABEL[data.riskLevel];
  summaryEl.textContent = `${formatAmount(state.request.amount)} · ${DECISION_CATEGORY_LABEL[state.request.category]} · ${DECISION_NATURE_LABEL[state.request.nature]}`;
  insightEl.textContent = data.insight;
  counterfactualEl.textContent = data.counterfactual;
  decisionIdEl.textContent = `decision_id: ${data.decisionId}`;
  decisionHashEl.textContent = `decision_hash: ${data.decisionHash}`;
  evidenceEl.innerHTML = data.evidence.map((item) => `<li>${item}</li>`).join("");
  errorEl.textContent = "";
  retryButton.disabled = false;
  retryButton.hidden = false;
  traceEl.textContent = `${DECISION_REVERSIBILITY_LABEL[state.request.reversibility]} · ${DECISION_INDUSTRY_LABEL[state.request.industry]}`;
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
          code: "BAD_RESPONSE",
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
      const result = await submitAuroraDecision(request);

      renderState(root, {
        status: "success",
        request,
        result,
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
