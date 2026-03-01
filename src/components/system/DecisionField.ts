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
  | "counterfactual-engine"
  | "regime-shift-detector"
  | "decision-entropy-map"
  | "";
type GroupFocus = "motor" | "advanced" | "";

type NodePoint = {
  index: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
};

type RegimeConfig = {
  spread: number;
  pull: number;
  lineDistance: number;
  secondaryCount: number;
  latentLineAlpha: number;
};

const RAF_KEY = "__auroraDecisionField";
const ACCENT_HEX = "#4F3C8C";
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
const VALID_PRODUCT_FOCUS = new Set<ProductFocus>([
  "core",
  "scenario",
  "risk",
  "signal",
  "ledger",
  "integration",
  "counterfactual-engine",
  "regime-shift-detector",
  "decision-entropy-map",
  "",
]);
const VALID_GROUP_FOCUS = new Set<GroupFocus>(["motor", "advanced", ""]);

const PRODUCT_FOCUS_PROFILE: Record<
  Exclude<ProductFocus, "">,
  { dominant: number; cluster: number[] }
> = {
  core: { dominant: 10, cluster: [8, 9, 10, 11, 12] },
  scenario: { dominant: 4, cluster: [2, 3, 4, 5, 6] },
  risk: { dominant: 15, cluster: [13, 14, 15, 16, 17] },
  signal: { dominant: 7, cluster: [5, 6, 7, 8, 9] },
  ledger: { dominant: 18, cluster: [16, 17, 18, 19, 20] },
  integration: { dominant: 11, cluster: [9, 10, 11, 12, 13] },
  "counterfactual-engine": { dominant: 3, cluster: [1, 2, 3, 4, 5] },
  "regime-shift-detector": { dominant: 14, cluster: [12, 13, 14, 15, 16] },
  "decision-entropy-map": { dominant: 19, cluster: [17, 18, 19, 20, 21] },
};

const GROUP_FOCUS_CLUSTER: Record<Exclude<GroupFocus, "">, number[]> = {
  motor: [3, 4, 5, 7, 9, 10, 11, 13, 15, 18],
  advanced: [2, 3, 4, 14, 15, 18, 19, 20],
};

const REGIME_CONFIG: Record<Regime, RegimeConfig> = {
  unstable: {
    spread: 0.48,
    pull: 0.052,
    lineDistance: 248,
    secondaryCount: 4,
    latentLineAlpha: 0.16,
  },
  compressing: {
    spread: 0.37,
    pull: 0.063,
    lineDistance: 226,
    secondaryCount: 4,
    latentLineAlpha: 0.13,
  },
  collision: {
    spread: 0.3,
    pull: 0.072,
    lineDistance: 208,
    secondaryCount: 4,
    latentLineAlpha: 0.11,
  },
  rupture: {
    spread: 0.24,
    pull: 0.078,
    lineDistance: 182,
    secondaryCount: 4,
    latentLineAlpha: 0.09,
  },
  reordering: {
    spread: 0.18,
    pull: 0.082,
    lineDistance: 164,
    secondaryCount: 4,
    latentLineAlpha: 0.07,
  },
  stabilized: {
    spread: 0.13,
    pull: 0.086,
    lineDistance: 146,
    secondaryCount: 3,
    latentLineAlpha: 0.05,
  },
};

class DecisionFieldController {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly nodes: NodePoint[] = [];

  private regime: Regime = "unstable";
  private algorithm: FieldAlgorithm = "core";
  private raf = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private bootAt = performance.now();
  private reducedMotion = false;
  private dominantIndex = 0;
  private secondaryIndices = new Set<number>();
  private productFocus: ProductFocus = "";
  private groupFocus: GroupFocus = "";
  private focusBlend = 0;
  private focusDominant: number | null = null;
  private focusCluster = new Set<number>();
  private lastFrameAt = performance.now();

  private readonly mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly mutationObserver = new MutationObserver(() => this.syncState());

  private readonly onResize = () => {
    this.syncSize();
    this.ensureNodeCount();
    this.clampNodes();
    this.render(performance.now());
  };

  private readonly onVisibility = () => {
    if (document.visibilityState === "visible") {
      this.start();
    } else {
      this.stop();
    }
  };

  private readonly onReduceMotionChange = () => {
    this.reducedMotion = this.mediaQuery.matches;
    if (this.reducedMotion) {
      this.stop();
      this.render(performance.now());
      return;
    }
    this.start();
  };

  private readonly frame = (time: number) => {
    this.raf = window.requestAnimationFrame(this.frame);
    this.render(time);
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

    this.reducedMotion = this.mediaQuery.matches;
    this.syncState();
    this.syncSize();
    this.ensureNodeCount();
    this.bind();

    if (!this.reducedMotion && document.visibilityState === "visible") {
      this.start();
    } else {
      this.render(performance.now());
    }
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.mediaQuery.removeEventListener("change", this.onReduceMotionChange);
    this.mutationObserver.disconnect();

    if (this.canvas.parentElement === this.root) {
      this.root.removeChild(this.canvas);
    }
  }

  private bind(): void {
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.mediaQuery.addEventListener("change", this.onReduceMotionChange);
    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "data-regime",
        "data-state",
        "data-algorithm",
        "data-product-focus",
        "data-group-focus",
        "data-binary-side",
        "data-scroll-velocity",
      ],
    });
  }

  private syncState(): void {
    const nextRegime = this.readRegime();
    const nextAlgorithm = this.readAlgorithm();
    const nextProduct = this.readProductFocus();
    const nextGroup = this.readGroupFocus();

    if (nextRegime !== this.regime) {
      this.regime = nextRegime;
    }

    this.algorithm = nextAlgorithm;
    this.productFocus = nextProduct;
    this.groupFocus = nextGroup;
  }

  private readRegime(): Regime {
    const raw = (document.body.dataset.regime ?? document.body.dataset.state ?? "unstable").trim();
    if (VALID_REGIMES.has(raw as Regime)) {
      return raw as Regime;
    }
    return "unstable";
  }

  private readAlgorithm(): FieldAlgorithm {
    const raw = (document.body.dataset.algorithm ?? "core").trim() as FieldAlgorithm;
    if (VALID_ALGORITHMS.has(raw)) {
      return raw;
    }
    return "core";
  }

  private readProductFocus(): ProductFocus {
    const raw = (document.body.dataset.productFocus ?? "").trim() as ProductFocus;
    if (VALID_PRODUCT_FOCUS.has(raw)) {
      return raw;
    }
    return "";
  }

  private readGroupFocus(): GroupFocus {
    const raw = (document.body.dataset.groupFocus ?? "").trim() as GroupFocus;
    if (VALID_GROUP_FOCUS.has(raw)) {
      return raw;
    }
    return "";
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
  }

  private targetNodeCount(): number {
    return 22;
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
    const baseX = 0.14 + this.seed(index, 0.31) * 0.72;
    const baseY = 0.18 + this.seed(index, 0.79) * 0.64;

    return {
      index,
      baseX,
      baseY,
      x: this.width * baseX,
      y: this.height * baseY,
      vx: 0,
      vy: 0,
      degree: 0,
    };
  }

  private seed(index: number, salt: number): number {
    const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  private clampNodes(): void {
    for (const node of this.nodes) {
      node.x = Math.min(this.width, Math.max(0, node.x));
      node.y = Math.min(this.height, Math.max(0, node.y));
    }
  }

  private start(): void {
    if (this.raf !== 0 || this.reducedMotion) return;
    this.raf = window.requestAnimationFrame(this.frame);
  }

  private stop(): void {
    if (this.raf === 0) return;
    window.cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private render(time: number): void {
    const cfg = REGIME_CONFIG[this.regime];
    const elapsed = Math.max(0, Math.min(64, time - this.lastFrameAt || 16));
    this.lastFrameAt = time;
    const focusTarget = this.productFocus ? 1 : 0;
    const step = this.easeOutStep(elapsed, 180);
    this.focusBlend += (focusTarget - this.focusBlend) * step;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.resolveFocusProfile();
    this.updateNodes(time, cfg);
    this.updateTopology(cfg);
    this.drawConnections(cfg);
    this.drawNodes();
  }

  private easeOutStep(deltaMs: number, durationMs: number): number {
    if (durationMs <= 0) return 1;
    const t = Math.min(1, deltaMs / durationMs);
    return 1 - (1 - t) * (1 - t);
  }

  private resolveFocusProfile(): void {
    const clamp = (index: number) => Math.max(0, Math.min(this.nodes.length - 1, index));

    if (this.productFocus) {
      const profile = PRODUCT_FOCUS_PROFILE[this.productFocus];
      this.focusDominant = clamp(profile.dominant);
      this.focusCluster = new Set(profile.cluster.map(clamp));
      return;
    }

    this.focusDominant = null;
    if (this.groupFocus) {
      this.focusCluster = new Set(GROUP_FOCUS_CLUSTER[this.groupFocus].map(clamp));
      return;
    }

    this.focusCluster.clear();
  }

  private updateNodes(time: number, cfg: RegimeConfig): void {
    const center = this.regimeCenter();
    const minDimension = Math.min(this.width, this.height);
    const spreadRadius = minDimension * cfg.spread;

    let introBlend = 0;
    const elapsed = time - this.bootAt;
    if (window.scrollY < 8 && elapsed < 3000) {
      introBlend = elapsed / 3000;
    }

    const velocityBias = Math.min(1, Number.parseFloat(document.body.dataset.scrollVelocity ?? "0") / 14);
    const pull = cfg.pull + velocityBias * 0.004 + this.focusBlend * 0.002;

    for (const node of this.nodes) {
      const target = this.nodeTarget(node, center, spreadRadius, introBlend);
      node.vx = node.vx * 0.78 + (target.x - node.x) * pull;
      node.vy = node.vy * 0.78 + (target.y - node.y) * pull;

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0) {
        node.x = 0;
        node.vx *= -0.35;
      } else if (node.x > this.width) {
        node.x = this.width;
        node.vx *= -0.35;
      }

      if (node.y < 0) {
        node.y = 0;
        node.vy *= -0.35;
      } else if (node.y > this.height) {
        node.y = this.height;
        node.vy *= -0.35;
      }
    }
  }

  private regimeCenter(): { x: number; y: number } {
    const cx = this.width * 0.5;
    const cy = this.height * 0.52;

    if (this.regime === "unstable") return { x: this.width * 0.58, y: this.height * 0.48 };
    if (this.regime === "compressing") return { x: this.width * 0.55, y: this.height * 0.5 };
    if (this.regime === "collision") return { x: this.width * 0.52, y: this.height * 0.52 };
    if (this.regime === "rupture") return { x: cx, y: cy };
    if (this.regime === "reordering") return { x: cx, y: this.height * 0.5 };
    return { x: cx, y: this.height * 0.5 };
  }

  private nodeTarget(
    node: NodePoint,
    center: { x: number; y: number },
    spreadRadius: number,
    introBlend: number
  ): { x: number; y: number } {
    const baseOffsetX = (node.baseX - 0.5) * spreadRadius * 1.6;
    const baseOffsetY = (node.baseY - 0.5) * spreadRadius * 1.6;
    let targetX = center.x + baseOffsetX;
    let targetY = center.y + baseOffsetY;

    const binarySide = document.body.dataset.binarySide;
    if (binarySide === "entropy" && node.index % 2 === 0) {
      targetX -= spreadRadius * 0.25;
    }
    if (binarySide === "center") {
      targetX = targetX * 0.82 + center.x * 0.18;
      targetY = targetY * 0.82 + center.y * 0.18;
    }

    if (this.algorithm === "core") {
      targetX = targetX * 0.82 + center.x * 0.18;
      targetY = targetY * 0.82 + center.y * 0.18;
    }

    if (this.algorithm === "scenario") {
      const centers = [
        { x: this.width * 0.3, y: this.height * 0.38 },
        { x: this.width * 0.7, y: this.height * 0.4 },
        { x: this.width * 0.52, y: this.height * 0.7 },
      ];
      const c = centers[node.index % centers.length];
      targetX = targetX * 0.44 + c.x * 0.56;
      targetY = targetY * 0.44 + c.y * 0.56;
    }

    if (this.algorithm === "risk") {
      const zone = { x: this.width * 0.34, y: this.height * 0.58 };
      if (node.index % 3 !== 0) {
        targetX = targetX * 0.3 + zone.x * 0.7;
        targetY = targetY * 0.3 + zone.y * 0.7;
      }
    }

    if (this.algorithm === "signal") {
      targetX = targetX * 0.6 + center.x * 0.4;
      targetY = targetY * 0.6 + center.y * 0.4;
    }

    if (this.algorithm === "ledger") {
      const t = this.nodes.length > 1 ? node.index / (this.nodes.length - 1) : 0;
      targetX = this.width * 0.2 + t * this.width * 0.6;
      targetY = center.y + ((node.index % 5) - 2) * Math.max(14, this.height * 0.02);
    }

    if (this.algorithm === "integration") {
      const t = this.nodes.length > 1 ? node.index / (this.nodes.length - 1) : 0;
      targetX = this.width * (0.2 + t * 0.6);
      targetY = this.height * (0.24 + (1 - t) * 0.52);
    }

    if (introBlend > 0) {
      targetX = targetX * (1 - introBlend * 0.42) + this.width * 0.5 * (introBlend * 0.42);
      targetY = targetY * (1 - introBlend * 0.42) + this.height * 0.5 * (introBlend * 0.42);
    }

    return { x: targetX, y: targetY };
  }

  private updateTopology(cfg: RegimeConfig): void {
    const baseThreshold = cfg.lineDistance;

    for (const node of this.nodes) {
      node.degree = 0;
    }

    for (let i = 0; i < this.nodes.length; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        let threshold = baseThreshold;
        if (this.focusCluster.has(i) && this.focusCluster.has(j)) {
          threshold += 22 * this.focusBlend;
        }

        if (distSq > threshold * threshold) continue;
        a.degree += 1;
        b.degree += 1;
      }
    }

    let dominant = this.focusDominant ?? 0;

    if (this.focusDominant === null) {
      let dominantDegree = this.nodes[dominant]?.degree ?? -1;
      for (let i = 0; i < this.nodes.length; i += 1) {
        const score = this.nodes[i].degree;
        if (score > dominantDegree) {
          dominantDegree = score;
          dominant = i;
        }
      }
    }

    this.dominantIndex = dominant;

    const ranked = this.nodes
      .map((node, idx) => {
        const clusterBias = this.focusCluster.has(idx) ? this.focusBlend * 1.6 : 0;
        return { idx, degree: node.degree + clusterBias };
      })
      .filter((entry) => entry.idx !== dominant)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, Math.max(3, Math.min(4, cfg.secondaryCount)))
      .map((entry) => entry.idx);

    this.secondaryIndices = new Set(ranked);
  }

  private accent(alpha: number): string {
    const r = Number.parseInt(ACCENT_HEX.slice(1, 3), 16);
    const g = Number.parseInt(ACCENT_HEX.slice(3, 5), 16);
    const b = Number.parseInt(ACCENT_HEX.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  }

  private drawConnections(cfg: RegimeConfig): void {
    const baseThreshold = cfg.lineDistance;
    let strongestLine:
      | {
          i: number;
          j: number;
          tension: number;
        }
      | null = null;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const inFocusCluster = this.focusCluster.has(i) && this.focusCluster.has(j);
        const threshold = baseThreshold + (inFocusCluster ? 22 * this.focusBlend : 0);

        if (distSq > threshold * threshold) continue;

        const dist = Math.sqrt(distSq);
        const t = 1 - dist / threshold;
        const aDominant = i === this.dominantIndex;
        const bDominant = j === this.dominantIndex;
        const aSecondary = this.secondaryIndices.has(i);
        const bSecondary = this.secondaryIndices.has(j);

        let alpha = cfg.latentLineAlpha * t;
        if (aDominant || bDominant) {
          alpha = 0.46 * t;
        } else if (aSecondary || bSecondary) {
          alpha = 0.28 * t;
        }

        if (inFocusCluster) {
          alpha += 0.1 * this.focusBlend * t;
        }

        if (this.algorithm === "signal" && !aDominant && !bDominant && !aSecondary && !bSecondary) {
          continue;
        }

        if (
          (aDominant || bDominant) &&
          (!strongestLine || t > strongestLine.tension)
        ) {
          strongestLine = { i, j, tension: t };
        }

        this.ctx.strokeStyle = `rgba(10, 10, 10, ${alpha.toFixed(3)})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }

    if (strongestLine) {
      const a = this.nodes[strongestLine.i];
      const b = this.nodes[strongestLine.j];
      this.ctx.strokeStyle = this.accent(0.88);
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();
    }
  }

  private drawNodes(): void {
    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const isDominant = i === this.dominantIndex;
      const isSecondary = this.secondaryIndices.has(i);

      let radius = 1.8;
      let color = "rgba(10, 10, 10, 0.38)";

      if (isDominant) {
        radius = 3.6;
        color = this.accent(1);
      } else if (isSecondary) {
        radius = 2.5;
        color = "rgba(10, 10, 10, 0.78)";
      }

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

export function mountDecisionField(root: HTMLElement): () => void {
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
