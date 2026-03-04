type StagePoint = {
  top: number;
  value: number;
  block: string;
};

type Product = "scenario" | "risk" | "signal" | "ledger" | "";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const regimeFromProgress = (progress: number): string => {
  if (progress < 0.16) return "humano";
  if (progress < 0.32) return "transicion";
  if (progress < 0.52) return "presion";
  if (progress < 0.7) return "ruptura";
  if (progress < 0.88) return "sustitucion";
  return "calculo";
};

const readStagePoints = (nodes: HTMLElement[]): StagePoint[] => {
  return nodes
    .map((node) => {
      const top = window.scrollY + node.getBoundingClientRect().top;
      const raw = Number.parseFloat(node.dataset.fieldStage ?? "0");
      const block = (node.dataset.fieldBlock ?? "hero").trim() || "hero";
      return {
        top,
        value: Number.isFinite(raw) ? clamp(raw, 0, 1) : 0,
        block,
      };
    })
    .sort((a, b) => a.top - b.top);
};

const progressFromProbe = (points: StagePoint[], probe: number): number => {
  if (!points.length) return 0;
  if (points.length === 1) return points[0].value;
  if (probe <= points[0].top) return points[0].value;

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    if (probe > next.top) continue;

    const span = Math.max(1, next.top - current.top);
    const ratio = clamp((probe - current.top) / span, 0, 1);
    return current.value + (next.value - current.value) * ratio;
  }

  return points[points.length - 1].value;
};

const resolveBlock = (points: StagePoint[], probe: number): string => {
  if (!points.length) return "hero";

  let active = points[0].block;
  for (const point of points) {
    if (probe < point.top) break;
    active = point.block;
  }

  return active;
};

const setProduct = (body: HTMLBodyElement, buttons: HTMLButtonElement[], value: Product): void => {
  if (value) {
    body.dataset.fieldProduct = value;
  } else {
    delete body.dataset.fieldProduct;
  }

  for (const button of buttons) {
    button.dataset.active = button.dataset.fieldProduct === value ? "true" : "false";
  }
};

export function mountHomeField(): () => void {
  const body = document.body;

  const stageNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-field-stage]"));
  const moduleButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".module-list button[data-field-product]")
  );

  let points = readStagePoints(stageNodes);

  const syncFieldFromScroll = (): void => {
    const probe = window.scrollY + window.innerHeight * 0.42;
    const progress = progressFromProbe(points, probe);
    const block = resolveBlock(points, probe);

    body.dataset.fieldProgress = progress.toFixed(4);
    body.dataset.regime = regimeFromProgress(progress);
    body.dataset.fieldBlock = block;
    body.dataset.fieldActive = "true";
  };

  const onResize = (): void => {
    points = readStagePoints(stageNodes);
    syncFieldFromScroll();
  };

  const onScroll = (): void => {
    syncFieldFromScroll();
  };

  const onPointerMove = (event: PointerEvent): void => {
    const x = clamp(event.clientX / Math.max(1, window.innerWidth), 0, 1);
    const y = clamp(event.clientY / Math.max(1, window.innerHeight), 0, 1);
    body.dataset.fieldCursorX = x.toFixed(4);
    body.dataset.fieldCursorY = y.toFixed(4);
  };

  const onPointerLeave = (): void => {
    delete body.dataset.fieldCursorX;
    delete body.dataset.fieldCursorY;
  };

  const buttonHandlers = moduleButtons.map((button) => {
    const product = (button.dataset.fieldProduct ?? "") as Product;
    const algorithm = (button.dataset.fieldAlgorithm ?? "core").trim();

    const onEnter = (): void => {
      setProduct(body, moduleButtons, product);
      body.dataset.algorithm = algorithm;
      body.dataset.fieldActive = "true";
    };

    const onLeave = (): void => {
      setProduct(body, moduleButtons, "");
      body.dataset.algorithm = "core";
      body.dataset.fieldActive = "true";
    };

    return { button, onEnter, onLeave };
  });

  for (const { button, onEnter, onLeave } of buttonHandlers) {
    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("focus", onEnter);
    button.addEventListener("pointerleave", onLeave);
    button.addEventListener("blur", onLeave);
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);

  body.dataset.algorithm = body.dataset.algorithm ?? "core";
  body.dataset.fieldActive = "true";
  setProduct(body, moduleButtons, "");
  syncFieldFromScroll();

  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerLeave);

    for (const { button, onEnter, onLeave } of buttonHandlers) {
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("focus", onEnter);
      button.removeEventListener("pointerleave", onLeave);
      button.removeEventListener("blur", onLeave);
    }

    delete body.dataset.fieldProduct;
    delete body.dataset.fieldCursorX;
    delete body.dataset.fieldCursorY;
    body.dataset.algorithm = "core";
    body.dataset.fieldActive = "false";
  };
}
