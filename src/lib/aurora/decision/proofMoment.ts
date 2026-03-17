import { submitAuroraDecision, toAuroraDecisionError } from "./adapter";
import { HOME_PROOF_REQUEST, DECISION_RISK_LEVEL_LABEL } from "./types";

function setText(root: ParentNode, selector: string, value: string): void {
  root.querySelector<HTMLElement>(selector)!.textContent = value;
}

function setEvidence(root: ParentNode, items: string[]): void {
  const list = root.querySelector<HTMLElement>("[data-proof-evidence]");

  if (!list) {
    return;
  }

  list.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

export function mountProofMoment(): void {
  const root = document.querySelector<HTMLElement>("[data-proof-moment]");
  const retryButton = root?.querySelector<HTMLButtonElement>("[data-proof-retry]");

  if (!root || !retryButton) {
    return;
  }

  async function run(): Promise<void> {
    root.dataset.status = "loading";
    retryButton.hidden = true;
    setText(root, "[data-proof-state]", "Calculando lectura institucional");
    setText(root, "[data-proof-insight]", "Aurora esta evaluando el movimiento de referencia.");
    setText(root, "[data-proof-counterfactual]", "Contrastando escenario alternativo.");
    setText(root, "[data-proof-decision-id]", "decision_id: esperando");
    setText(root, "[data-proof-decision-hash]", "decision_hash: esperando");
    setEvidence(root, [
      "Monto de referencia cargado",
      "Caja comprometida 30d validada",
      "Reversibilidad y naturaleza registradas",
    ]);

    try {
      const result = await submitAuroraDecision(HOME_PROOF_REQUEST);

      root.dataset.status = "success";
      setText(root, "[data-proof-state]", DECISION_RISK_LEVEL_LABEL[result.data.riskLevel]);
      setText(root, "[data-proof-insight]", result.data.insight);
      setText(root, "[data-proof-counterfactual]", result.data.counterfactual);
      setText(root, "[data-proof-decision-id]", `decision_id: ${result.data.decisionId}`);
      setText(root, "[data-proof-decision-hash]", `decision_hash: ${result.data.decisionHash}`);
      setEvidence(root, result.data.evidence);
      return;
    } catch (error) {
      const decisionError = toAuroraDecisionError(error);

      root.dataset.status = "error";
      setText(root, "[data-proof-state]", "Calculo no disponible");
      setText(root, "[data-proof-insight]", decisionError.message);
      setText(root, "[data-proof-counterfactual]", "El adapter sigue listo para reintento cuando el endpoint este disponible.");
      setText(root, "[data-proof-decision-id]", "decision_id: --");
      setText(root, "[data-proof-decision-hash]", "decision_hash: --");
      setEvidence(root, []);
      retryButton.hidden = !decisionError.retriable;
    }
  }

  retryButton.addEventListener("click", () => {
    void run();
  });

  void run();
}
