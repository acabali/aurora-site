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

type FieldNode = { id: number; px: number; py: number };
type PositionedNode = { id: number; x: number; y: number };

const CONTROLLER_KEY = "__auroraDecisionFieldController";
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const PRODUCT_SET = new Set<ProductKey>([
  "core",
  "scenario",
  "risk",
  "signal",
  "ledger",
  "counterfactual",
  "regime",
  "entropy",
  "integration",
]);

const EVENT_ANIMATE_REASONS = new Set([
  "scroll",
  "focus",
  "hover",
  "active",
  "reset",
  "click",
  "state",
  "resize",
]);

const PRODUCT_INTENSITY: Record<ProductKey, number> = {
  core: 0.15,
  scenario: 0.26,
  risk: 0.44,
  signal: 0.58,
  ledger: 0.34,
  counterfactual: 0.62,
  regime: 0.48,
  entropy: 0.76,
  integration: 0.52,
};

class DecisionFieldController {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private width = 1;
  private height = 1;
  private dpr = 1;

  private baseNodes: FieldNode[] = [];

  private targetProgress = 0;
  private renderedProgress = 0;

  private targetBias = PRODUCT_INTENSITY.core;
  private renderedBias = PRODUCT_INTENSITY.core;

  private state: InteractionState = "idle";
  private product: ProductKey = "core";

  private framesLeft = 0;
  private rafId = 0;

  private lineLatent = "rgba(255,255,255,0.08)";
  private lineActive = "rgba(0,255,156,0.35)";
  private lineDominant = "rgba(106,92,255,0.78)";
  private nodeActive = "rgba(0,255,156,0.9)";
  private nodeDominant = "rgba(106,92,255,0.96)";

  private mutationObserver = new MutationObserver(() => {
    this.syncState();
    this.scheduleRender("state");
  });

  private onResize = (): void => {
    this.syncSize();
    this.scheduleRender("resize");
  };

  private onFieldUpdate = (event: Event): void => {
    const detail = (event as CustomEvent<{ reason?: string }>).detail;
    const reason = typeof detail?.reason === "string" ? detail.reason : "state";
    this.syncState();
    this.scheduleRender(reason);
  };

  constructor(root: HTMLElement) {
    this.root = root;

    const context = document.createElement("canvas").getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("DecisionField: no canvas context");
    }

    this.ctx = context;
    this.canvas = this.ctx.canvas;
    this.canvas.className = "decision-field-canvas";
    this.root.appendChild(this.canvas);

    this.syncSize();
    this.syncPalette();
    this.ensureSeedNodes();
    this.syncState();
    this.bind();
    this.render();
  }

  destroy(): void {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("aurora:field-update", this.onFieldUpdate as EventListener);
    this.mutationObserver.disconnect();

    if (this.canvas.parentNode === this.root) {
      this.root.removeChild(this.canvas);
    }
  }

  private bind(): void {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("aurora:field-update", this.onFieldUpdate as EventListener);

    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-field-progress", "data-field-product", "data-field-state", "data-field-bias"],
    });
  }

  private shouldAnimate(reason: string): boolean {
    return EVENT_ANIMATE_REASONS.has(reason);
  }

  private scheduleRender(reason: string): void {
    if (this.shouldAnimate(reason)) {
      const budget = reason === "scroll" ? 10 : 7;
      this.framesLeft = Math.max(this.framesLeft, budget);
      if (!this.rafId) {
        this.rafId = window.requestAnimationFrame(this.tick);
      }
      return;
    }

    this.render();
  }

  private tick = (): void => {
    this.rafId = 0;
    this.render();

    if (this.framesLeft > 0 && this.needsAnotherFrame()) {
      this.framesLeft -= 1;
      this.rafId = window.requestAnimationFrame(this.tick);
    } else {
      this.framesLeft = 0;
    }
  };

  private needsAnotherFrame(): boolean {
    const dp = Math.abs(this.targetProgress - this.renderedProgress);
    const db = Math.abs(this.targetBias - this.renderedBias);
    return dp > 0.001 || db > 0.001 || this.framesLeft > 1;
  }

  private syncPalette(): void {
    const style = window.getComputedStyle(document.documentElement);
    this.lineLatent = style.getPropertyValue("--field-line-latent").trim() || this.lineLatent;
    this.lineActive = style.getPropertyValue("--field-line-active").trim() || this.lineActive;
    this.lineDominant = style.getPropertyValue("--field-dominant").trim() || this.lineDominant;
    this.nodeActive = style.getPropertyValue("--field-node-active").trim() || this.nodeActive;
    this.nodeDominant = style.getPropertyValue("--field-node-dominant").trim() || this.nodeDominant;
  }

  private syncSize(): void {
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.ensureSeedNodes();
  }

  private ensureSeedNodes(): void {
    const target = this.width < 700 ? 26 : this.width < 1080 ? 34 : 44;
    while (this.baseNodes.length < target) {
      const id = this.baseNodes.length;
      const px = 0.1 + this.seed(id, 0.13) * 0.8;
      const py = 0.12 + this.seed(id, 0.71) * 0.76;
      this.baseNodes.push({ id, px, py });
    }
    if (this.baseNodes.length > target) {
      this.baseNodes.length = target;
    }
  }

  private seed(value: number, salt: number): number {
    const raw = Math.sin(value * 12.9898 + salt * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  }

  private syncState(): void {
    const rawProgress = Number.parseFloat(document.body.dataset.fieldProgress ?? "0");
    this.targetProgress = Number.isFinite(rawProgress) ? clamp(rawProgress, 0, 1) : 0;

    const rawState = (document.body.dataset.fieldState ?? "idle") as InteractionState;
    this.state = rawState === "focus" || rawState === "active" || rawState === "reset" ? rawState : "idle";

    const rawProduct = (document.body.dataset.fieldProduct ?? "core") as ProductKey;
    this.product = PRODUCT_SET.has(rawProduct) ? rawProduct : "core";

    const rawBias = Number.parseFloat(document.body.dataset.fieldBias ?? `${PRODUCT_INTENSITY[this.product]}`);
    const fallbackBias = PRODUCT_INTENSITY[this.product];
    this.targetBias = Number.isFinite(rawBias) ? clamp(rawBias, 0, 1) : fallbackBias;
  }

  private resolveVisibleCount(): number {
    const base = this.width < 700 ? 12 : this.width < 1080 ? 16 : 22;
    const densityBoost = Math.round(this.renderedProgress * 8 + this.renderedBias * 11);
    return clamp(base + densityBoost, 8, this.baseNodes.length);
  }

  private resolveNodes(): PositionedNode[] {
    const visibleCount = this.resolveVisibleCount();
    const compression = 0.92 - this.renderedProgress * 0.2;

    const points: PositionedNode[] = [];
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    for (let i = 0; i < visibleCount; i += 1) {
      const node = this.baseNodes[i];
      let x = centerX + (node.px - 0.5) * this.width * compression;
      let y = centerY + (node.py - 0.5) * this.height * compression;

      if (this.product === "core") {
        x = x * 0.78 + centerX * 0.22;
        y = y * 0.78 + centerY * 0.22;
      }

      if (this.product === "scenario") {
        const t = visibleCount <= 1 ? 0 : i / (visibleCount - 1);
        x = this.width * (0.12 + t * 0.76);
        y = this.height * (0.28 + Math.sin(t * Math.PI) * 0.2);
      }

      if (this.product === "risk") {
        const spread = 0.76 + this.renderedBias * 0.26;
        x = centerX + (x - centerX) * spread;
        y = centerY + (y - centerY) * spread;
      }

      if (this.product === "signal") {
        x = x * 0.66 + centerX * 0.34;
        y = y * 0.66 + centerY * 0.34;
      }

      if (this.product === "ledger") {
        const t = visibleCount <= 1 ? 0 : i / (visibleCount - 1);
        x = this.width * (0.1 + t * 0.8);
        y = this.height * (0.48 + ((i % 4) - 1.5) * 0.03);
      }

      if (this.product === "counterfactual") {
        const t = visibleCount <= 1 ? 0 : i / (visibleCount - 1);
        const mirror = i % 2 === 0 ? -1 : 1;
        x = this.width * (0.5 + mirror * (0.08 + t * 0.24));
        y = this.height * (0.2 + t * 0.62);
      }

      if (this.product === "regime") {
        const tilt = 0.18 + this.renderedBias * 0.22;
        const rx = x - centerX;
        const ry = y - centerY;
        x = centerX + rx * (1 - tilt) - ry * tilt;
        y = centerY + rx * tilt + ry * (1 - tilt);
      }

      if (this.product === "entropy") {
        const noise = (this.seed(i, 0.33) - 0.5) * (18 + this.renderedProgress * 34);
        const scatter = (this.seed(i, 0.81) - 0.5) * (16 + this.renderedBias * 28);
        x += noise;
        y += scatter;
      }

      if (this.product === "integration") {
        const t = visibleCount <= 1 ? 0 : i / (visibleCount - 1);
        const lane = i % 2 === 0 ? 0.33 : 0.67;
        x = this.width * (0.14 + t * 0.72);
        y = this.height * lane;
      }

      points.push({
        id: node.id,
        x: clamp(x, 0, this.width),
        y: clamp(y, 0, this.height),
      });
    }

    return points;
  }

  private drawConnections(points: PositionedNode[]): void {
    const maxDistance = Math.min(this.width, this.height) * 0.36;
    const maxDistanceSq = maxDistance * maxDistance;

    const interactionBoost = this.state === "active" ? 0.3 : this.state === "focus" ? 0.18 : 0;
    const alphaBase = 0.03 + this.renderedProgress * 0.08 + interactionBoost;

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];

      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxDistanceSq) continue;

        const distance = Math.sqrt(d2);
        const ratio = 1 - distance / maxDistance;
        const dominant = this.product === "signal" || this.product === "integration" || this.product === "counterfactual";

        this.ctx.strokeStyle = dominant ? this.lineActive : this.lineLatent;
        this.ctx.globalAlpha = clamp(alphaBase * ratio, 0.01, this.state === "idle" ? 0.09 : 0.34);
        this.ctx.lineWidth = clamp(0.6 + this.renderedBias * 0.9, 0.5, 2);
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawNodes(points: PositionedNode[]): void {
    const dominantIndex = Math.floor(points.length * (0.4 + this.renderedProgress * 0.35));

    const idleAlphaCap = this.state === "idle" ? 0.14 : 0.92;
    const nodeAlpha = clamp(0.12 + this.renderedProgress * 0.25 + this.renderedBias * 0.45, 0.08, idleAlphaCap);

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const dominant = i === dominantIndex;

      this.ctx.globalAlpha = dominant ? clamp(nodeAlpha + 0.12, 0.1, 1) : nodeAlpha;
      this.ctx.fillStyle = dominant ? this.nodeDominant : this.nodeActive;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, dominant ? 2.2 : 1.3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawAxis(): void {
    const alpha = this.state === "idle" ? 0.04 : 0.12;
    this.ctx.strokeStyle = this.lineDominant;
    this.ctx.globalAlpha = alpha;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(this.width * 0.08, this.height * 0.5);
    this.ctx.lineTo(this.width * 0.92, this.height * 0.5);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this.width * 0.5, this.height * 0.08);
    this.ctx.lineTo(this.width * 0.5, this.height * 0.92);
    this.ctx.stroke();

    this.ctx.globalAlpha = 1;
  }

  private render(): void {
    this.syncPalette();
    this.syncState();

    this.renderedProgress += (this.targetProgress - this.renderedProgress) * 0.28;
    this.renderedBias += (this.targetBias - this.renderedBias) * 0.24;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const points = this.resolveNodes();
    if (points.length === 0) return;

    this.drawAxis();
    this.drawConnections(points);
    this.drawNodes(points);
  }
}

export function mountDecisionField(root: HTMLElement): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const scope = window as Window & { [CONTROLLER_KEY]?: DecisionFieldController };

  if (scope[CONTROLLER_KEY]) {
    scope[CONTROLLER_KEY]?.destroy();
  }

  const controller = new DecisionFieldController(root);
  scope[CONTROLLER_KEY] = controller;

  return () => {
    controller.destroy();
    if (scope[CONTROLLER_KEY] === controller) {
      delete scope[CONTROLLER_KEY];
    }
  };
}
