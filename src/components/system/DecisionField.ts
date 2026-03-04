type Regime =
  | "unstable"
  | "compressing"
  | "collision"
  | "rupture"
  | "reordering"
  | "stabilized";

type FieldAlgorithm = "core" | "scenario" | "risk" | "signal" | "ledger" | "integration";
type ProductFocus =
  | "core"
  | "scenario"
  | "risk"
  | "signal"
  | "ledger"
  | "integration"
  | "counterfactual"
  | "regime"
  | "entropy"
  | "";
type GroupFocus = "system-modules" | "advanced-capabilities" | "";

type NodePoint = {
  index: number;
  baseX: number;
  baseY: number;
  degree: number;
};

type PositionedNode = {
  index: number;
  x: number;
  y: number;
};

type RegimeConfig = {
  spread: number;
  lineDistance: number;
  secondaryCount: number;
  latentLineAlpha: number;
};

const RAF_KEY = "__auroraDecisionField";
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const FIELD_LABELS = ["cost", "demand", "channel", "regulation", "liquidity"] as const;

const VALID_ALGORITHMS = new Set<FieldAlgorithm>([
  "core",
  "scenario",
  "risk",
  "signal",
  "ledger",
  "integration",
]);

const VALID_REGIMES = new Set<Regime>([
  "unstable",
  "compressing",
  "collision",
  "rupture",
  "reordering",
  "stabilized",
]);

const VALID_PRODUCTS = new Set<ProductFocus>([
  "core",
  "scenario",
  "risk",
  "signal",
  "ledger",
  "integration",
  "counterfactual",
  "regime",
  "entropy",
  "",
]);

const VALID_GROUPS = new Set<GroupFocus>(["system-modules", "advanced-capabilities", ""]);

class DecisionFieldController {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly nodes: NodePoint[] = [];

  private width = 0;
  private height = 0;
  private dpr = 1;
  private compact = false;

  private regime: Regime = "unstable";
  private algorithm: FieldAlgorithm = "core";
  private productFocus: ProductFocus = "";
  private groupFocus: GroupFocus = "";
  private fieldProgress = 0;
  private fieldBlock = "hero";
  private fieldActive = false;
  private dominantWeight = 1.2;
  private secondaryWeight = 1.04;
  private latentWeight = 0.45;

  private dominantIndex = 0;
  private secondaryIndices = new Set<number>();

  private fieldLineLatent = "rgba(230, 237, 248, 0.032)";
  private fieldLineActive = "rgba(230, 237, 248, 0.152)";
  private fieldDominant = "rgba(155, 175, 214, 0.82)";
  private fieldNodeLatent = "rgba(230, 237, 248, 0.21)";
  private fieldNodeActive = "rgba(230, 237, 248, 0.42)";
  private fieldNodeDominant = "rgba(193, 210, 238, 0.94)";

  private raf = 0;

  private readonly mutationObserver = new MutationObserver(() => {
    this.syncState();
    this.queueRender();
  });

  private readonly onResize = () => {
    this.syncSize();
    this.ensureNodeCount();
    this.syncPalette();
    this.queueRender();
  };

  private readonly onVisibility = () => {
    if (document.visibilityState !== "visible") return;
    this.queueRender();
  };

  constructor(root: HTMLElement) {
    this.root = root;

    const context = document.createElement("canvas").getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("DecisionField: Canvas 2D context unavailable.");
    }

    this.ctx = context;
    this.canvas = this.ctx.canvas;
    this.canvas.className = "decision-field-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    this.root.appendChild(this.canvas);

    this.syncState();
    this.syncSize();
    this.ensureNodeCount();
    this.syncPalette();
    this.bind();
    this.render();
  }

  destroy(): void {
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
    }

    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.mutationObserver.disconnect();

    if (this.canvas.parentElement === this.root) {
      this.root.removeChild(this.canvas);
    }
  }

  private bind(): void {
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "data-regime",
        "data-algorithm",
        "data-field-progress",
        "data-field-product",
        "data-product-focus",
        "data-group-focus",
        "data-field-dominant-weight",
        "data-field-secondary-weight",
        "data-field-latent-weight",
        "data-field-block",
        "data-field-active",
      ],
    });
  }

  private queueRender(): void {
    if (this.raf !== 0) return;
    this.raf = window.requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
  }

  private syncState(): void {
    this.regime = this.readRegime();
    this.algorithm = this.readAlgorithm();
    this.productFocus = this.readProductFocus();
    this.groupFocus = this.readGroupFocus();
    this.fieldProgress = this.readFieldProgress();
    this.fieldBlock = this.readFieldBlock();
    this.fieldActive = (document.body.dataset.fieldActive ?? "false") === "true";
    this.dominantWeight = this.readWeight("fieldDominantWeight", 1.2);
    this.secondaryWeight = this.readWeight("fieldSecondaryWeight", 1.04);
    this.latentWeight = this.readWeight("fieldLatentWeight", 0.45);
  }

  private syncPalette(): void {
    const style = window.getComputedStyle(document.documentElement);
    this.fieldLineLatent = style.getPropertyValue("--field-line-latent").trim() || this.fieldLineLatent;
    this.fieldLineActive = style.getPropertyValue("--field-line-active").trim() || this.fieldLineActive;
    this.fieldDominant = style.getPropertyValue("--field-dominant").trim() || this.fieldDominant;
    this.fieldNodeLatent = style.getPropertyValue("--field-node-latent").trim() || this.fieldNodeLatent;
    this.fieldNodeActive = style.getPropertyValue("--field-node-active").trim() || this.fieldNodeActive;
    this.fieldNodeDominant =
      style.getPropertyValue("--field-node-dominant").trim() || this.fieldNodeDominant;
  }

  private readRegime(): Regime {
    const raw = (document.body.dataset.regime ?? "unstable").trim();
    if (VALID_REGIMES.has(raw as Regime)) return raw as Regime;
    return "unstable";
  }

  private readAlgorithm(): FieldAlgorithm {
    const raw = (document.body.dataset.algorithm ?? "core").trim() as FieldAlgorithm;
    if (VALID_ALGORITHMS.has(raw)) return raw;
    return "core";
  }

  private readProductFocus(): ProductFocus {
    const raw = (document.body.dataset.fieldProduct ?? document.body.dataset.productFocus ?? "").trim() as ProductFocus;
    if (VALID_PRODUCTS.has(raw)) return raw;
    return "";
  }

  private readGroupFocus(): GroupFocus {
    const raw = (document.body.dataset.groupFocus ?? "").trim() as GroupFocus;
    if (VALID_GROUPS.has(raw)) return raw;
    return "";
  }

  private readFieldProgress(): number {
    const raw = Number.parseFloat(document.body.dataset.fieldProgress ?? "");
    if (!Number.isFinite(raw)) {
      return this.regimeToProgress(this.regime);
    }
    return clamp(raw, 0, 1);
  }

  private readWeight(
    key: "fieldDominantWeight" | "fieldSecondaryWeight" | "fieldLatentWeight",
    fallback: number
  ): number {
    const raw = Number.parseFloat(document.body.dataset[key] ?? "");
    if (!Number.isFinite(raw)) return fallback;
    return clamp(raw, 0, 2.8);
  }

  private readFieldBlock(): string {
    const raw = (document.body.dataset.fieldBlock ?? "hero").trim();
    if (!raw) return "hero";
    return raw;
  }

  private syncSize(): void {
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.compact = this.width <= 768;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private targetNodeCount(): number {
    if (this.width <= 480) return 5;
    if (this.width <= 768) return 6;
    if (this.width <= 1024) return 8;
    if (this.width <= 1400) return 12;
    return 16;
  }

  private ensureNodeCount(): void {
    const target = this.targetNodeCount();

    while (this.nodes.length < target) {
      const index = this.nodes.length;
      this.nodes.push(this.createNode(index));
    }

    if (this.nodes.length > target) {
      this.nodes.length = target;
    }
  }

  private createNode(index: number): NodePoint {
    const baseX = 0.1 + this.seed(index, 0.37) * 0.8;
    const baseY = 0.16 + this.seed(index, 0.83) * 0.66;

    return {
      index,
      baseX,
      baseY,
      degree: 0,
    };
  }

  private seed(index: number, salt: number): number {
    const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  private regimeToProgress(regime: Regime): number {
    switch (regime) {
      case "unstable":
        return 0;
      case "compressing":
        return 0.22;
      case "collision":
        return 0.4;
      case "rupture":
        return 0.58;
      case "reordering":
        return 0.76;
      case "stabilized":
      default:
        return 1;
    }
  }

  private resolveConfig(progress: number): RegimeConfig {
    const p = clamp(progress, 0, 1);

    return {
      spread: 0.64 - p * 0.26,
      lineDistance: 250 - p * 82,
      secondaryCount: p > 0.72 ? 3 : 4,
      latentLineAlpha: 0.038 - p * 0.012,
    };
  }

  private resolveCenter(progress: number): { x: number; y: number } {
    const p = clamp(progress, 0, 1);
    const base = {
      x: this.width * (0.52 - p * 0.04),
      y: this.height * (0.5 + p * 0.02),
    };

    return this.applyBlockBias(base);
  }

  private applyBlockBias(center: { x: number; y: number }): { x: number; y: number } {
    switch (this.fieldBlock) {
      case "block-0":
        return { x: center.x - this.width * 0.01, y: center.y - this.height * 0.01 };
      case "block-1":
        return { x: center.x + this.width * 0.008, y: center.y - this.height * 0.008 };
      case "block-2":
        return { x: center.x - this.width * 0.01, y: center.y + this.height * 0.011 };
      case "block-3":
        return { x: center.x + this.width * 0.01, y: center.y + this.height * 0.013 };
      case "block-4":
        return { x: center.x, y: center.y + this.height * 0.016 };
      case "hero":
      default:
        return center;
    }
  }

  private focusCenter(): { x: number; y: number } | null {
    switch (this.productFocus) {
      case "core":
        return { x: this.width * 0.5, y: this.height * 0.52 };
      case "counterfactual":
      case "scenario":
        return { x: this.width * 0.33, y: this.height * 0.4 };
      case "regime":
      case "risk":
        return { x: this.width * 0.34, y: this.height * 0.6 };
      case "signal":
        return { x: this.width * 0.62, y: this.height * 0.34 };
      case "ledger":
        return { x: this.width * 0.7, y: this.height * 0.58 };
      case "integration":
      case "entropy":
        return { x: this.width * 0.57, y: this.height * 0.64 };
      default:
        return null;
    }
  }

  private resolvePoints(cfg: RegimeConfig): PositionedNode[] {
    const center = this.resolveCenter(this.fieldProgress);
    const focus = this.focusCenter();
    const focusBlend = this.productFocus ? (this.groupFocus === "advanced-capabilities" ? 0.27 : 0.2) : 0;
    const spreadRadius = Math.min(this.width, this.height) * cfg.spread;

    return this.nodes.map((node) => {
      let x = center.x + (node.baseX - 0.5) * spreadRadius * 1.54;
      let y = center.y + (node.baseY - 0.5) * spreadRadius * 1.54;

      if (this.algorithm === "core") {
        x = x * 0.86 + center.x * 0.14;
        y = y * 0.86 + center.y * 0.14;
      }

      if (this.algorithm === "scenario") {
        const t = this.nodes.length > 1 ? node.index / (this.nodes.length - 1) : 0;
        const curveX = this.width * (0.2 + t * 0.62);
        const arc = Math.sin(t * Math.PI) * this.height * 0.14;
        x = x * 0.42 + curveX * 0.58;
        y = y * 0.42 + (this.height * 0.35 + arc) * 0.58;
      }

      if (this.algorithm === "risk") {
        const zone = { x: this.width * 0.35, y: this.height * 0.58 };
        if (node.index % 3 !== 0) {
          x = x * 0.28 + zone.x * 0.72;
          y = y * 0.28 + zone.y * 0.72;
        }
      }

      if (this.algorithm === "signal") {
        x = x * 0.64 + center.x * 0.36;
        y = y * 0.64 + center.y * 0.36;
      }

      if (this.algorithm === "ledger") {
        const t = this.nodes.length > 1 ? node.index / (this.nodes.length - 1) : 0;
        x = this.width * (0.16 + t * 0.68);
        y = this.height * (0.5 + ((node.index % 3) - 1) * 0.022);
      }

      if (this.algorithm === "integration") {
        const t = this.nodes.length > 1 ? node.index / (this.nodes.length - 1) : 0;
        x = this.width * (0.18 + t * 0.64);
        y = this.height * (0.28 + (1 - t) * 0.46);
      }

      if (focus) {
        x = x * (1 - focusBlend) + focus.x * focusBlend;
        y = y * (1 - focusBlend) + focus.y * focusBlend;
      }

      return {
        index: node.index,
        x: clamp(x, 0, this.width),
        y: clamp(y, 0, this.height),
      };
    });
  }

  private pickDominantByProduct(length: number): number {
    if (!length) return 0;

    const fit = (value: number) => Math.max(0, Math.min(length - 1, value));

    switch (this.productFocus) {
      case "core":
        return fit(2);
      case "scenario":
      case "counterfactual":
        return fit(1);
      case "risk":
      case "regime":
        return fit(3);
      case "signal":
        return fit(4);
      case "ledger":
        return fit(Math.floor(length * 0.78));
      case "integration":
      case "entropy":
        return fit(Math.floor(length * 0.64));
      default:
        return fit(Math.floor(length * 0.4));
    }
  }

  private updateTopology(points: PositionedNode[], cfg: RegimeConfig): void {
    const threshold = cfg.lineDistance + (this.groupFocus === "advanced-capabilities" ? -12 : 0);
    const thresholdSq = threshold * threshold;

    for (const node of this.nodes) {
      node.degree = 0;
    }

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > thresholdSq) continue;

        this.nodes[i].degree += 1;
        this.nodes[j].degree += 1;
      }
    }

    let dominant = this.pickDominantByProduct(points.length);
    let dominantDegree = this.nodes[dominant]?.degree ?? -1;

    for (let i = 0; i < this.nodes.length; i += 1) {
      if (this.nodes[i].degree <= dominantDegree) continue;
      dominant = i;
      dominantDegree = this.nodes[i].degree;
    }

    this.dominantIndex = dominant;

    const ranked = this.nodes
      .map((node, idx) => ({ idx, degree: node.degree }))
      .filter((entry) => entry.idx !== dominant)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, Math.max(2, Math.min(4, cfg.secondaryCount)))
      .map((entry) => entry.idx);

    this.secondaryIndices = new Set(ranked);
  }

  private drawLine(a: PositionedNode, b: PositionedNode, width: number, color: string, alpha: number): void {
    this.ctx.globalAlpha = clamp(alpha, 0, 1);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();

    if (this.algorithm === "scenario") {
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const normX = dist > 0 ? -dy / dist : 0;
      const normY = dist > 0 ? dx / dist : 0;
      const curve = clamp(10 + dist * 0.08, 10, 38);
      const cx = mx + normX * curve;
      const cy = my + normY * curve;
      this.ctx.moveTo(a.x, a.y);
      this.ctx.quadraticCurveTo(cx, cy, b.x, b.y);
    } else {
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
    }

    this.ctx.stroke();
  }

  private drawConnections(points: PositionedNode[], cfg: RegimeConfig): void {
    const threshold = cfg.lineDistance;
    const thresholdSq = threshold * threshold;
    const restFactor = this.fieldActive ? 1 : 0.18;
    const focusFactor = this.productFocus ? 1.15 : 1;
    const dominantBoost = clamp(this.dominantWeight + this.fieldProgress * 0.48, 0.8, 2.5);
    const riskBoost = this.algorithm === "risk" ? 1.36 : 1;
    const signalAttenuation = this.algorithm === "signal" ? 0.54 : 1;

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > thresholdSq) continue;

        const dist = Math.sqrt(distSq);
        const t = 1 - dist / threshold;

        const aDominant = i === this.dominantIndex;
        const bDominant = j === this.dominantIndex;
        const aSecondary = this.secondaryIndices.has(i);
        const bSecondary = this.secondaryIndices.has(j);

        const isDominant = aDominant || bDominant;
        const isSecondary = aSecondary || bSecondary;

        let lineWidth = clamp(0.36 + this.fieldProgress * 0.1, 0.3, 0.9);
        let alpha = cfg.latentLineAlpha * t * this.latentWeight * restFactor;
        let color = this.fieldLineLatent;

        if (isDominant) {
          lineWidth = clamp((1.18 + this.fieldProgress * 0.5) * riskBoost, 0.8, 2.1);
          alpha = (0.12 + this.fieldProgress * 0.19) * t * focusFactor * dominantBoost * 0.45 * restFactor;
          color = this.fieldDominant;
        } else if (isSecondary) {
          lineWidth = clamp((0.82 + this.fieldProgress * 0.3) * riskBoost, 0.5, 1.42);
          alpha = (0.082 + this.fieldProgress * 0.12) * t * this.secondaryWeight * restFactor;
          color = this.fieldLineActive;
        }

        if (this.algorithm === "signal") {
          if (!isDominant && !isSecondary) {
            alpha *= signalAttenuation * 0.4;
          } else {
            alpha *= signalAttenuation;
          }
        }

        if (this.compact) {
          lineWidth = Math.min(lineWidth, 1.2);
          alpha *= 0.78;
        }

        if (alpha <= 0.001) continue;

        this.drawLine(a, b, lineWidth, color, alpha);
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawNodes(points: PositionedNode[]): void {
    const restFactor = this.fieldActive ? 1 : 0.2;
    const focusFactor = this.productFocus ? 1.14 : 1;

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const isDominant = i === this.dominantIndex;
      const isSecondary = this.secondaryIndices.has(i);

      let radius = 1.22;
      let alpha = 0.14 * this.latentWeight * restFactor;
      let color = this.fieldNodeLatent;

      if (isDominant) {
        radius = 2.8;
        alpha = clamp(0.34 * this.dominantWeight * focusFactor * restFactor, 0.05, 1);
        color = this.fieldNodeDominant;
      } else if (isSecondary) {
        radius = 1.95;
        alpha = clamp(0.24 * this.secondaryWeight * restFactor, 0.05, 1);
        color = this.fieldNodeActive;
      }

      if (this.compact) {
        radius *= 0.82;
        alpha *= 0.78;
      }

      this.ctx.globalAlpha = clamp(alpha, 0, 1);
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  private resolveLabelNodes(length: number): number[] {
    if (!length) return [];
    if (length <= 5) return Array.from({ length }, (_, i) => i);

    return [
      0,
      Math.floor(length * 0.22),
      Math.floor(length * 0.44),
      Math.floor(length * 0.66),
      Math.max(0, Math.min(length - 1, Math.floor(length * 0.88))),
    ];
  }

  private drawSemanticNodes(points: PositionedNode[]): void {
    const indices = this.resolveLabelNodes(points.length);
    if (!indices.length) return;

    this.ctx.save();
    this.ctx.font = "10px 'IBM Plex Sans', sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";

    for (let i = 0; i < indices.length; i += 1) {
      const point = points[indices[i]];
      if (!point) continue;

      const label = FIELD_LABELS[i] ?? FIELD_LABELS[FIELD_LABELS.length - 1];
      const labelAlpha = this.compact ? 0.32 : 0.46;

      this.ctx.globalAlpha = labelAlpha;
      this.ctx.fillStyle = this.fieldNodeActive;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, this.compact ? 1.3 : 1.8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.globalAlpha = labelAlpha * 0.94;
      this.ctx.fillStyle = this.fieldLineActive;
      this.ctx.fillText(label, point.x + 8, point.y);
    }

    this.ctx.restore();
    this.ctx.globalAlpha = 1;
  }

  private drawLedgerTicks(points: PositionedNode[]): void {
    if (this.algorithm !== "ledger" || points.length < 2) return;

    const sorted = [...points].sort((a, b) => a.x - b.x);
    const tickHeight = this.compact ? 6 : 9;

    this.ctx.save();
    this.ctx.strokeStyle = this.fieldLineActive;
    this.ctx.lineWidth = this.compact ? 1 : 1.2;
    this.ctx.globalAlpha = this.compact ? 0.22 : 0.28;

    for (let i = 0; i < sorted.length; i += 1) {
      const point = sorted[i];
      if (i % 2 !== 0 && !this.compact) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y - tickHeight);
      this.ctx.lineTo(point.x, point.y + tickHeight);
      this.ctx.stroke();
    }

    this.ctx.restore();
    this.ctx.globalAlpha = 1;
  }

  private render(): void {
    this.syncState();
    this.syncPalette();

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (document.visibilityState !== "visible") {
      return;
    }

    if (this.nodes.length === 0) {
      return;
    }

    const cfg = this.resolveConfig(this.fieldProgress);
    const points = this.resolvePoints(cfg);

    this.updateTopology(points, cfg);
    this.drawConnections(points, cfg);
    this.drawNodes(points);
    this.drawSemanticNodes(points);
    this.drawLedgerTicks(points);
  }
}

export function mountDecisionField(root: HTMLElement): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const scope = window as Window & {
    [RAF_KEY]?: DecisionFieldController;
  };

  const existing = scope[RAF_KEY];
  if (existing) {
    existing.destroy();
  }

  const controller = new DecisionFieldController(root);
  scope[RAF_KEY] = controller;

  return () => {
    controller.destroy();
    if (scope[RAF_KEY] === controller) {
      delete scope[RAF_KEY];
    }
  };
}
