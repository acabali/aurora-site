import { submitAuroraDecision, toAuroraDecisionError } from "./adapter";
import { HOME_PROOF_REQUEST } from "./types";

function setText(root: ParentNode, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setLines(root: ParentNode, selector: string, lines: string[]): void {
  const list = root.querySelector<HTMLElement>(selector);

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

export function mountProofMoment(): void {
  const root = document.querySelector<HTMLElement>("[data-proof-moment]");
  const retryButton = root?.querySelector<HTMLButtonElement>("[data-proof-retry]");

  if (!root || !retryButton) {
    return;
  }

  async function run(): Promise<void> {
    root.dataset.status = "loading";
    retryButton.hidden = true;
    setText(root, "[data-proof-state]", "loading");
    setText(root, "[data-proof-primary]", "registrando movimiento de referencia");
    setText(root, "[data-proof-secondary]", "esperando respuesta canónica");
    setLines(root, "[data-proof-terminal]", [
      "POST /api/v1/movement/evaluate",
      "capital: 50000",
      "absorption: restricted",
      "reversibility: partial",
      "protocol: vΩ",
    ]);

    try {
      const result = await submitAuroraDecision(HOME_PROOF_REQUEST);

      root.dataset.status = "success";
      setText(root, "[data-proof-state]", result.data.system_reading.primary);
      setText(root, "[data-proof-primary]", result.data.compression_mechanism);
      setText(root, "[data-proof-secondary]", result.data.system_reading.secondary);
      setLines(root, "[data-proof-terminal]", [
        `decision_id: ${result.data.decision_id}`,
        `run_signature: ${result.data.run_signature}`,
        `pressure_score: ${result.data.pressure_score.toFixed(2)}`,
        `pressure_day: ${result.data.pressure_day}`,
        `structural_load: ${result.data.structural_load}`,
        `timestamp: ${result.data.timestamp}`,
      ]);
      return;
    } catch (error) {
      const decisionError = toAuroraDecisionError(error);

      root.dataset.status = "error";
      setText(root, "[data-proof-state]", "sistema no disponible");
      setText(root, "[data-proof-primary]", "Aurora no devolvió una lectura utilizable.");
      setText(root, "[data-proof-secondary]", "El bloque queda cerrado hasta un retry válido.");
      setLines(root, "[data-proof-terminal]", [
        "error: sistema no disponible",
        `code: ${decisionError.code}`,
        `status: ${decisionError.status ?? "--"}`,
      ]);
      retryButton.hidden = !decisionError.retriable;
    }
  }

  retryButton.addEventListener("click", () => {
    void run();
  });

  void run();
}
