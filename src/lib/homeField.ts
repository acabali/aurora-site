import { AuroraProEngine } from "./auroraEngine/proEngine";

type SectionId = "hero" | "system" | "misfit" | "engine" | "what" | "demo";
type InteractionState = "idle" | "focus" | "active" | "reset";
type ProductKey =
  | "core"
  | "scenario"
  | "risk"
  | "signal"
  | "ledger"
  | "counterfactual"
  | "regime"
  | "entropy"
  | "integration";

const SECTION_IDS: SectionId[] = ["hero", "system", "misfit", "engine", "what", "demo"];
const PRODUCT_KEYS: ProductKey[] = [
  "core",
  "scenario",
  "risk",
  "signal",
  "ledger",
  "counterfactual",
  "regime",
  "entropy",
  "integration",
];

const PRODUCT_SET = new Set<ProductKey>(PRODUCT_KEYS);

const SECTION_DEFAULT_PRODUCT: Record<SectionId, ProductKey> = {
  hero: "core",
  system: "scenario",
  misfit: "risk",
  engine: "signal",
  what: "entropy",
  demo: "integration",
};

const PRODUCT_BIAS: Record<ProductKey, number> = {
  core: 0.12,
  scenario: 0.23,
  risk: 0.42,
  signal: 0.58,
  ledger: 0.33,
  counterfactual: 0.64,
  regime: 0.46,
  entropy: 0.78,
  integration: 0.51,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const emitFieldUpdate = (reason: string): void => {
  window.dispatchEvent(new CustomEvent("aurora:field-update", { detail: { reason } }));
};

const isSection = (value: string): value is SectionId => SECTION_IDS.includes(value as SectionId);
const isProduct = (value: string): value is ProductKey => PRODUCT_SET.has(value as ProductKey);

const resolveDominantSection = (ratios: Map<SectionId, number>, fallback: SectionId): SectionId => {
  let best = fallback;
  let bestRatio = -1;

  for (const sectionId of SECTION_IDS) {
    const ratio = ratios.get(sectionId) ?? 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = sectionId;
    }
  }

  return best;
};

const resolveSignalLatency = (progress: number, bias: number): string => {
  const value = Math.round(12 + progress * 15 + bias * 9);
  return `${value}ms`;
};

const resolveDecisionTrace = (progress: number, product: ProductKey): string => {
  const left = Math.round(progress * 99)
    .toString()
    .padStart(2, "0");
  const right = product.length.toString().padStart(2, "0");
  return `${left}.${right}`;
};

const resolveRegimeDrift = (progress: number, bias: number): string => {
  return (0.08 + progress * 0.34 + bias * 0.27).toFixed(2);
};

const resolveEntropyIndex = (progress: number, product: ProductKey): string => {
  const productFactor = product === "entropy" ? 0.24 : product === "risk" ? 0.18 : 0.12;
  return clamp(0.12 + progress * 0.41 + productFactor, 0, 0.99).toFixed(2);
};

const resolveCounterfactual = (product: ProductKey): string => {
  if (product === "counterfactual") return "BRANCH-A";
  if (product === "risk") return "BRANCH-R";
  if (product === "signal") return "BRANCH-S";
  return "AUTO";
};

const syncTelemetry = (product: ProductKey, progress: number): void => {
  const bias = PRODUCT_BIAS[product];

  const values: Record<string, string> = {
    "signal-latency": resolveSignalLatency(progress, bias),
    "decision-trace": resolveDecisionTrace(progress, product),
    "regime-drift": resolveRegimeDrift(progress, bias),
    "entropy-index": resolveEntropyIndex(progress, product),
    "counterfactual-branch": resolveCounterfactual(product),
  };

  const nodes = document.querySelectorAll<HTMLElement>("[data-signal-value]");
  for (const node of nodes) {
    const key = node.dataset.signalValue;
    if (!key) continue;
    const next = values[key];
    if (typeof next === "string") {
      node.textContent = next;
    }
  }
};

const setBodyState = (
  body: HTMLElement,
  params: {
    interaction: InteractionState;
    product: ProductKey;
    section: SectionId;
    progress: number;
  }
): void => {
  body.dataset.fieldState = params.interaction;
  body.dataset.fieldProduct = params.product;
  body.dataset.fieldSection = params.section;
  body.dataset.fieldProgress = params.progress.toFixed(4);
  body.dataset.fieldBias = PRODUCT_BIAS[params.product].toFixed(4);
};

export function mountAuroraField(root: HTMLElement): void {
  const canvas = root.querySelector("[data-aurora-canvas]") as HTMLCanvasElement | null;
  if (!canvas) return;

  new AuroraProEngine(canvas);
}

export function initHomeSystem(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const body = document.body;
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-home-section]"));
  const productButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-product]"));
  const productsRoot = document.querySelector<HTMLElement>("[data-products]");

  if (sections.length === 0 || productButtons.length === 0) {
    return () => {};
  }

  const ratios = new Map<SectionId, number>();
  for (const sectionId of SECTION_IDS) ratios.set(sectionId, 0);

  let currentSection: SectionId = "hero";
  let scrollProgress = 0;
  let focusedProduct = "";
  let activeProduct = "";
  let interaction: InteractionState = "idle";

  const readProgress = (): number => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return clamp(window.scrollY / max, 0, 1);
  };

  const resolveProduct = (): ProductKey => {
    if (activeProduct && isProduct(activeProduct)) return activeProduct;
    if (focusedProduct && isProduct(focusedProduct)) return focusedProduct;
    return SECTION_DEFAULT_PRODUCT[currentSection];
  };

  const markProductState = (): void => {
    for (const button of productButtons) {
      const key = button.dataset.product ?? "";
      button.dataset.focus = key === focusedProduct ? "true" : "false";
      button.dataset.active = key === activeProduct ? "true" : "false";
    }
  };

  const commit = (reason: string): void => {
    const product = resolveProduct();

    setBodyState(body, {
      interaction,
      product,
      section: currentSection,
      progress: scrollProgress,
    });

    syncTelemetry(product, scrollProgress);
    markProductState();
    emitFieldUpdate(reason);
  };

  const revealSection = (node: HTMLElement, ratio: number): void => {
    if (ratio >= 0.2) {
      node.dataset.revealed = "true";
    }
  };

  const refreshDominantSection = (): void => {
    currentSection = resolveDominantSection(ratios, currentSection);
  };

  const onScroll = (): void => {
    scrollProgress = readProgress();
    refreshDominantSection();
    if (!activeProduct && !focusedProduct) {
      interaction = "idle";
    }
    commit("scroll");
  };

  const toFocus = (product: string): void => {
    if (activeProduct) return;
    if (!isProduct(product)) return;
    focusedProduct = product;
    interaction = "focus";
    commit("focus");
  };

  const toIdle = (): void => {
    if (activeProduct) return;
    focusedProduct = "";
    interaction = "idle";
    commit("reset");
  };

  const toggleActive = (product: string): void => {
    if (!isProduct(product)) return;

    if (activeProduct === product) {
      activeProduct = "";
      focusedProduct = "";
      interaction = "reset";
      commit("reset");
      interaction = "idle";
      commit("idle");
      return;
    }

    activeProduct = product;
    focusedProduct = product;
    interaction = "active";
    commit("active");
  };

  const onEsc = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    if (!activeProduct && !focusedProduct) return;

    activeProduct = "";
    focusedProduct = "";
    interaction = "reset";
    commit("reset");
    interaction = "idle";
    commit("idle");
  };

  const onClickOutside = (event: PointerEvent): void => {
    if (!activeProduct) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (productsRoot?.contains(target)) return;

    activeProduct = "";
    focusedProduct = "";
    interaction = "reset";
    commit("reset");
    interaction = "idle";
    commit("idle");
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (!isSection(id)) continue;

        const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        ratios.set(id, ratio);
        revealSection(entry.target as HTMLElement, ratio);
      }

      refreshDominantSection();
      commit("scroll");
    },
    {
      threshold: [0, 0.12, 0.24, 0.42, 0.64, 0.84],
      rootMargin: "-14% 0px -20% 0px",
    }
  );

  for (const section of sections) {
    section.dataset.revealed = "false";
    sectionObserver.observe(section);
  }

  const unbinds: Array<() => void> = [];

  for (const button of productButtons) {
    const key = button.dataset.product ?? "";

    const onEnter = (): void => toFocus(key);
    const onLeave = (): void => toIdle();
    const onFocus = (): void => toFocus(key);
    const onBlur = (): void => toIdle();
    const onClick = (): void => toggleActive(key);

    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointerleave", onLeave);
    button.addEventListener("focus", onFocus);
    button.addEventListener("blur", onBlur);
    button.addEventListener("click", onClick);

    unbinds.push(() => {
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("pointerleave", onLeave);
      button.removeEventListener("focus", onFocus);
      button.removeEventListener("blur", onBlur);
      button.removeEventListener("click", onClick);
    });
  }

  scrollProgress = readProgress();
  commit("boot");

  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("keydown", onEsc);
  document.addEventListener("pointerdown", onClickOutside);

  return () => {
    sectionObserver.disconnect();
    for (const unbind of unbinds) unbind();
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("keydown", onEsc);
    document.removeEventListener("pointerdown", onClickOutside);

    delete body.dataset.fieldState;
    delete body.dataset.fieldProduct;
    delete body.dataset.fieldSection;
    delete body.dataset.fieldProgress;
    delete body.dataset.fieldBias;
  };
}
