type StagePoint = {
  top: number;
  value: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const regimeFromProgress = (progress: number): string => {
  if (progress < 0.16) return "unstable";
  if (progress < 0.32) return "compressing";
  if (progress < 0.5) return "collision";
  if (progress < 0.68) return "rupture";
  if (progress < 0.86) return "reordering";
  return "stabilized";
};

const readStagePoints = (stageNodes: HTMLElement[]): StagePoint[] => {
  return stageNodes
    .map((node) => {
      const raw = Number.parseFloat(node.dataset.fieldStage ?? "0");
      const top = window.scrollY + node.getBoundingClientRect().top;
      return {
        top,
        value: Number.isFinite(raw) ? clamp(raw, 0, 1) : 0,
      };
    })
    .sort((a, b) => a.top - b.top);
};

const interpolateProgress = (points: StagePoint[], probe: number): number => {
  if (!points.length) return 0;
  if (points.length === 1) return points[0].value;

  if (probe <= points[0].top) return points[0].value;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (probe > next.top) continue;

    const span = Math.max(1, next.top - current.top);
    const ratio = clamp((probe - current.top) / span, 0, 1);
    return current.value + (next.value - current.value) * ratio;
  }

  return points[points.length - 1].value;
};

export function mountHomeField(): () => void {
  const body = document.body;
  const menu = document.querySelector<HTMLElement>("[data-products-menu]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-products-toggle]");
  const productNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-product]"));
  const stageNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-field-stage]"));

  if (!menu || !toggle) {
    return () => {};
  }

  let isMenuOpen = false;
  let raf = 0;
  let smoothedProgress = Number.parseFloat(body.dataset.fieldProgress ?? "0") || 0;
  let targetProgress = smoothedProgress;
  let smoothedVelocity = 0;
  let lastY = window.scrollY;
  let lastT = performance.now();
  let stagePoints = readStagePoints(stageNodes);

  const closeMenu = (): void => {
    if (!isMenuOpen) return;
    isMenuOpen = false;
    body.dataset.productsOpen = "false";
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  };

  const openMenu = (): void => {
    if (isMenuOpen) return;
    isMenuOpen = true;
    menu.hidden = false;
    body.dataset.productsOpen = "true";
    toggle.setAttribute("aria-expanded", "true");
  };

  const setProductFocus = (node: HTMLElement): void => {
    const product = node.dataset.product ?? "";
    const group = node.dataset.group ?? "";
    const algorithm = node.dataset.fieldAlgorithm ?? "core";

    body.dataset.productFocus = product;
    body.dataset.groupFocus = group;
    body.dataset.algorithm = algorithm;
  };

  const clearProductFocus = (): void => {
    delete body.dataset.productFocus;
    delete body.dataset.groupFocus;
    body.dataset.algorithm = "core";
  };

  const writeFieldState = (progress: number): void => {
    const bounded = clamp(progress, 0, 1);
    body.dataset.fieldProgress = bounded.toFixed(4);
    body.dataset.regime = regimeFromProgress(bounded);

    const velocity = clamp(smoothedVelocity, 0, 14);
    body.dataset.scrollVelocity = velocity.toFixed(3);
  };

  const scheduleFrame = (): void => {
    if (raf !== 0) return;
    raf = window.requestAnimationFrame(stepFrame);
  };

  const refreshTarget = (): void => {
    const probe = window.scrollY + window.innerHeight * 0.46;
    targetProgress = interpolateProgress(stagePoints, probe);
  };

  const stepFrame = (): void => {
    raf = 0;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      smoothedProgress = targetProgress;
    } else {
      smoothedProgress += (targetProgress - smoothedProgress) * 0.12;
    }

    smoothedVelocity += (0 - smoothedVelocity) * 0.16;

    writeFieldState(smoothedProgress);

    const delta = Math.abs(targetProgress - smoothedProgress);
    if (delta > 0.001 || smoothedVelocity > 0.04) {
      scheduleFrame();
    }
  };

  const onScroll = (): void => {
    const now = performance.now();
    const dy = window.scrollY - lastY;
    const dt = Math.max(1, now - lastT);

    lastY = window.scrollY;
    lastT = now;

    const instantVelocity = clamp((Math.abs(dy) / dt) * 18, 0, 14);
    smoothedVelocity += (instantVelocity - smoothedVelocity) * 0.3;

    refreshTarget();
    scheduleFrame();
  };

  const onResize = (): void => {
    stagePoints = readStagePoints(stageNodes);
    refreshTarget();
    scheduleFrame();
  };

  const onToggleClick = (): void => {
    if (isMenuOpen) {
      closeMenu();
      clearProductFocus();
      return;
    }
    openMenu();
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!isMenuOpen) return;
    const target = event.target as Node;
    if (menu.contains(target) || toggle.contains(target)) return;
    closeMenu();
    clearProductFocus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    closeMenu();
    clearProductFocus();
    toggle.focus();
  };

  const onMenuLeave = (): void => {
    if (document.activeElement && menu.contains(document.activeElement)) return;
    clearProductFocus();
  };

  const nodeHandlers = productNodes.map((node) => {
    const onEnter = (): void => setProductFocus(node);
    const onBlur = (): void => {
      window.setTimeout(onMenuLeave, 0);
    };
    return { node, onEnter, onBlur };
  });

  for (const { node, onEnter, onBlur } of nodeHandlers) {
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("focus", onEnter);
    node.addEventListener("pointerleave", onMenuLeave);
    node.addEventListener("blur", onBlur);
  }

  toggle.addEventListener("click", onToggleClick);
  menu.addEventListener("pointerleave", onMenuLeave);
  document.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  body.dataset.productsOpen = "false";
  body.dataset.algorithm = body.dataset.algorithm ?? "core";
  refreshTarget();
  writeFieldState(smoothedProgress);
  scheduleFrame();

  return () => {
    if (raf !== 0) {
      window.cancelAnimationFrame(raf);
    }

    toggle.removeEventListener("click", onToggleClick);
    menu.removeEventListener("pointerleave", onMenuLeave);
    document.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    for (const { node, onEnter, onBlur } of nodeHandlers) {
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("focus", onEnter);
      node.removeEventListener("pointerleave", onMenuLeave);
      node.removeEventListener("blur", onBlur);
    }

    closeMenu();
    clearProductFocus();
  };
}
