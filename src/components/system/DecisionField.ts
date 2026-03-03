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
type GroupFocus = "motor-structural" | "advanced-systems" | "";

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

type ProductProfile = {
  dominantBoost: number;
  secondaryBoost: number;
  latentBoost: number;
  strokeBoost: number;
  opacityBoost: number;
  pullBoost: number;
  densityShift: number;
};

const RAF_KEY = "__auroraDecisionField";
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const STROKE_BASE = 0.9;
const STROKE_ACTIVE = 1.35;
const STROKE_DOMINANT = 2.2;
const INITIAL_SPREAD = 0.78;
const SMOOTHING_FACTOR = 0.18;
const SCROLL_DOMINANCE_MULTIPLIER = 0.85;
const DEFAULT_TRANSITION_MS = 180;
const BASE_PRODUCT_PROFILE: ProductProfile = {
  dominantBoost: 0,
  secondaryBoost: 0,
  latentBoost: 0,
  strokeBoost: 0,
  opacityBoost: 0,
  pullBoost: 0,
  densityShift: 0,
};
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
const VALID_GROUPS = new Set<GroupFocus>(["motor-structural", "advanced-systems", ""]);

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
  private reducedMotion = false;
  private dominantIndex = 0;
  private secondaryIndices = new Set<number>();
  private productFocus: ProductFocus = "";
  private groupFocus: GroupFocus = "";
  private productBlend = 0;
  private targetProductBlend = 0;
  private lastFrameTime = performance.now();
  private fieldTransitionMs = DEFAULT_TRANSITION_MS;
  private profileCurrent: ProductProfile = { ...BASE_PRODUCT_PROFILE };
  private profileTarget: ProductProfile = { ...BASE_PRODUCT_PROFILE };
  private fieldProgress = 0;
  private smoothedProgress = 0;
  private fieldBlock = "hero";
  private dominantWeight = 1.2;
  private secondaryWeight = 1.1;
  private latentWeight = 0.85;
  private fieldLineLatent = "rgba(232, 237, 245, 0.1)";
  private fieldLineActive = "rgba(232, 237, 245, 0.22)";
  private fieldNodeLatent = "rgba(232, 237, 245, 0.12)";
  private fieldNodeActive = "rgba(232, 237, 245, 0.3)";
  private fieldNodeDominant = "rgba(79, 60, 140, 0.92)";
  private fieldDominant = "rgba(232, 237, 245, 0.42)";

  private readonly mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly mutationObserver = new MutationObserver(() => this.syncState());

  private readonly onResize = () => {
    this.syncSize();
    this.syncPalette();
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
    this.syncPalette();
    this.syncState();
    this.smoothedProgress = this.fieldProgress;
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
        "data-binary-side",
        "data-scroll-velocity",
        "data-field-progress",
        "data-product-focus",
        "data-group-focus",
        "data-field-dominant-weight",
        "data-field-secondary-weight",
        "data-field-latent-weight",
        "data-field-block",
        "data-field-transition-ms",
      ],
    });
  }

  private syncState(): void {
    const nextRegime = this.readRegime();
    const nextAlgorithm = this.readAlgorithm();
    const nextProduct = this.readProductFocus();
    const nextGroup = this.readGroupFocus();
    const nextProgress = this.readFieldProgress();

    if (nextRegime !== this.regime) {
      this.regime = nextRegime;
    }

    const productChanged = nextProduct !== this.productFocus;
    const groupChanged = nextGroup !== this.groupFocus;

    this.algorithm = nextAlgorithm;
    this.productFocus = nextProduct;
    this.groupFocus = nextGroup;
    this.fieldProgress = nextProgress;
    this.fieldBlock = this.readFieldBlock();
    this.fieldTransitionMs = this.readFieldTransitionMs();
    this.targetProductBlend = nextProduct ? 1 : 0;

    if (productChanged && this.productFocus && nextProduct) {
      this.productBlend = Math.min(this.productBlend, 0.42);
    }

    if (productChanged || groupChanged) {
      this.profileTarget = this.resolveProductProfile(nextProduct, nextGroup);
    }

    this.dominantWeight = this.readWeight("fieldDominantWeight", 1.2);
    this.secondaryWeight = this.readWeight("fieldSecondaryWeight", 1.1);
    this.latentWeight = this.readWeight("fieldLatentWeight", 0.85);
  }

  private syncPalette(): void {
    const style = window.getComputedStyle(document.documentElement);
    this.fieldLineLatent = style.getPropertyValue("--field-line-latent").trim() || this.fieldLineLatent;
    this.fieldLineActive = style.getPropertyValue("--field-line-active").trim() || this.fieldLineActive;
    this.fieldNodeLatent = style.getPropertyValue("--field-node-latent").trim() || this.fieldNodeLatent;
    this.fieldNodeActive = style.getPropertyValue("--field-node-active").trim() || this.fieldNodeActive;
    this.fieldNodeDominant =
      style.getPropertyValue("--field-node-dominant").trim() || this.fieldNodeDominant;
    this.fieldDominant = style.getPropertyValue("--field-dominant").trim() || this.fieldDominant;
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
    if (VALID_PRODUCTS.has(raw)) {
      return raw;
    }
    return "";
  }

  private readGroupFocus(): GroupFocus {
    const raw = (document.body.dataset.groupFocus ?? "").trim() as GroupFocus;
    if (VALID_GROUPS.has(raw)) {
      return raw;
    }
    return "";
  }

  private readFieldProgress(): number {
    const raw = Number.parseFloat(document.body.dataset.fieldProgress ?? "");
    if (!Number.isFinite(raw)) {
      return this.regimeToProgress(this.regime);
    }
    return Math.max(0, Math.min(1, raw));
  }

  private readWeight(
    key: "fieldDominantWeight" | "fieldSecondaryWeight" | "fieldLatentWeight",
    fallback: number
  ): number {
    const raw = Number.parseFloat(document.body.dataset[key] ?? "");
    if (!Number.isFinite(raw)) return fallback;
    return clamp(raw, 0, 2);
  }

  private readFieldBlock(): string {
    const raw = (document.body.dataset.fieldBlock ?? "hero").trim();
    if (!raw) return "hero";
    return raw;
  }

  private readFieldTransitionMs(): number {
    const raw = Number.parseFloat(document.body.dataset.fieldTransitionMs ?? "");
    if (!Number.isFinite(raw)) return DEFAULT_TRANSITION_MS;
    return clamp(raw, 120, 480);
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
    return 20;
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
    const p = progress;
    const start = REGIME_CONFIG.unstable;
    const end = REGIME_CONFIG.stabilized;
    return {
      spread: start.spread + (end.spread - start.spread) * p,
      pull: start.pull + (end.pull - start.pull) * p,
      lineDistance: start.lineDistance + (end.lineDistance - start.lineDistance) * p,
      secondaryCount: p >= 0.72 ? 3 : 4,
      latentLineAlpha: start.latentLineAlpha + (end.latentLineAlpha - start.latentLineAlpha) * p,
    };
  }

  private easeOutStep(deltaMs: number, durationMs: number): number {
    const ratio = clamp(deltaMs / Math.max(1, durationMs), 0, 1);
    return 1 - Math.pow(1 - ratio, 3);
  }

  private mixValue(current: number, target: number, step: number): number {
    return current + (target - current) * step;
  }

  private mixProfile(current: ProductProfile, target: ProductProfile, step: number): ProductProfile {
    return {
      dominantBoost: this.mixValue(current.dominantBoost, target.dominantBoost, step),
      secondaryBoost: this.mixValue(current.secondaryBoost, target.secondaryBoost, step),
      latentBoost: this.mixValue(current.latentBoost, target.latentBoost, step),
      strokeBoost: this.mixValue(current.strokeBoost, target.strokeBoost, step),
      opacityBoost: this.mixValue(current.opacityBoost, target.opacityBoost, step),
      pullBoost: this.mixValue(current.pullBoost, target.pullBoost, step),
      densityShift: this.mixValue(current.densityShift, target.densityShift, step),
    };
  }

  private resolveProductProfile(product: ProductFocus, group: GroupFocus): ProductProfile {
    const profile: ProductProfile = { ...BASE_PRODUCT_PROFILE };

    switch (product) {
      case "core":
        profile.dominantBoost = 0.22;
        profile.secondaryBoost = 0.08;
        profile.latentBoost = -0.06;
        profile.strokeBoost = 0.08;
        profile.opacityBoost = 0.08;
        profile.pullBoost = 0.002;
        profile.densityShift = 8;
        break;
      case "scenario":
      case "counterfactual":
        profile.dominantBoost = 0.16;
        profile.secondaryBoost = 0.12;
        profile.latentBoost = -0.04;
        profile.strokeBoost = 0.06;
        profile.opacityBoost = 0.06;
        profile.pullBoost = 0.003;
        profile.densityShift = 4;
        break;
      case "risk":
      case "regime":
        profile.dominantBoost = 0.24;
        profile.secondaryBoost = 0.1;
        profile.latentBoost = -0.1;
        profile.strokeBoost = 0.1;
        profile.opacityBoost = 0.1;
        profile.pullBoost = 0.004;
        profile.densityShift = -6;
        break;
      case "signal":
        profile.dominantBoost = 0.18;
        profile.secondaryBoost = 0.14;
        profile.latentBoost = -0.16;
        profile.strokeBoost = 0.14;
        profile.opacityBoost = 0.14;
        profile.pullBoost = 0.003;
        profile.densityShift = -12;
        break;
      case "ledger":
        profile.dominantBoost = 0.14;
        profile.secondaryBoost = 0.1;
        profile.latentBoost = -0.05;
        profile.strokeBoost = 0.05;
        profile.opacityBoost = 0.03;
        profile.pullBoost = 0.002;
        profile.densityShift = 2;
        break;
      case "integration":
      case "entropy":
        profile.dominantBoost = 0.2;
        profile.secondaryBoost = 0.15;
        profile.latentBoost = -0.08;
        profile.strokeBoost = 0.09;
        profile.opacityBoost = 0.07;
        profile.pullBoost = 0.004;
        profile.densityShift = 6;
        break;
      default:
        break;
    }

    if (group === "advanced-systems") {
      profile.strokeBoost += 0.06;
      profile.opacityBoost += 0.06;
      profile.pullBoost += 0.001;
      profile.densityShift -= 4;
    }

    return profile;
  }

  private render(time: number): void {
    if (this.fieldBlock === "hero") {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    const frameDt = Math.max(1, time - this.lastFrameTime);
    this.lastFrameTime = time;

    const step = this.reducedMotion ? 1 : this.easeOutStep(frameDt, this.fieldTransitionMs);
    this.productBlend = this.mixValue(this.productBlend, this.targetProductBlend, step);
    this.profileCurrent = this.mixProfile(this.profileCurrent, this.profileTarget, step);

    if (this.reducedMotion) {
      this.smoothedProgress = this.fieldProgress;
    } else {
      this.smoothedProgress += (this.fieldProgress - this.smoothedProgress) * SMOOTHING_FACTOR;
    }

    const cfg = this.resolveConfig(this.smoothedProgress);

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.updateNodes(cfg, this.smoothedProgress);
    this.updateTopology(cfg);
    this.drawConnections(cfg);
    this.drawNodes();
  }

  private updateNodes(cfg: RegimeConfig, progress: number): void {
    const center = this.regimeCenter(progress);
    const minDimension = Math.min(this.width, this.height);
    const spreadRadius = minDimension * cfg.spread * INITIAL_SPREAD;

    const velocityBias = Math.min(1, Number.parseFloat(document.body.dataset.scrollVelocity ?? "0") / 14);
    const groupPull =
      this.groupFocus === "advanced-systems"
        ? 0.005
        : this.groupFocus === "motor-structural"
          ? 0.003
          : 0;
    const profilePull = this.profileCurrent.pullBoost * this.productBlend;
    const pull = Math.min(cfg.pull + this.productBlend * 0.004, cfg.pull + 0.006);

    for (const node of this.nodes) {
      const target = this.nodeTarget(node, center, spreadRadius);
      node.vx = node.vx * 0.65 + (target.x - node.x) * pull;
      node.vy = node.vy * 0.65 + (target.y - node.y) * pull;

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

  private regimeCenter(progress: number): { x: number; y: number } {
    const p = Math.max(0, Math.min(1, progress));
    const startX = this.width * 0.58;
    const endX = this.width * 0.5;
    const startY = this.height * 0.48;
    const endY = this.height * 0.5;
    const base = {
      x: startX + (endX - startX) * p,
      y: startY + (endY - startY) * p,
    };
    return this.applyBlockBias(base);
  }

  private applyBlockBias(center: { x: number; y: number }): { x: number; y: number } {
    switch (this.fieldBlock) {
      case "block-0":
        return { x: center.x - this.width * 0.015, y: center.y - this.height * 0.01 };
      case "block-1":
        return { x: center.x + this.width * 0.01, y: center.y - this.height * 0.008 };
      case "block-2":
        return { x: center.x - this.width * 0.012, y: center.y + this.height * 0.008 };
      case "block-3":
        return { x: center.x + this.width * 0.012, y: center.y + this.height * 0.012 };
      case "block-4":
        return { x: center.x, y: center.y + this.height * 0.016 };
      case "hero":
      default:
        return center;
    }
  }

  private nodeTarget(
    node: NodePoint,
    center: { x: number; y: number },
    spreadRadius: number
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

    const focusCenter = this.focusCenter();
    if (focusCenter) {
      const profileClusterBias = this.profileCurrent.secondaryBoost * 0.08 * this.productBlend;
      const clusterBias = this.productBlend * (this.groupFocus === "advanced-systems" ? 0.28 : 0.2) + profileClusterBias;
      targetX = targetX * (1 - clusterBias) + focusCenter.x * clusterBias;
      targetY = targetY * (1 - clusterBias) + focusCenter.y * clusterBias;
    }

    return { x: targetX, y: targetY };
  }

  private updateTopology(cfg: RegimeConfig): void {
    const groupDensityShift =
      this.groupFocus === "advanced-systems"
        ? -14
        : this.groupFocus === "motor-structural"
          ? 8
          : 0;
    const profileDensityShift = this.profileCurrent.densityShift * this.productBlend;
    const threshold = cfg.lineDistance + groupDensityShift * this.productBlend - this.productBlend * 10 + profileDensityShift;
    const thresholdSq = threshold * threshold;

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
        if (distSq > thresholdSq) continue;
        a.degree += 1;
        b.degree += 1;
      }
    }

    let dominant = this.pickDominantByProduct();
    let dominantDegree = this.nodes[dominant]?.degree ?? -1;
    for (let i = 0; i < this.nodes.length; i += 1) {
      const score = this.nodes[i].degree;
      if (score > dominantDegree) {
        dominantDegree = score;
        dominant = i;
      }
    }

    this.dominantIndex = dominant;

    const ranked = this.nodes
      .map((node, idx) => ({ idx, degree: node.degree }))
      .filter((entry) => entry.idx !== dominant)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, Math.max(3, Math.min(4, cfg.secondaryCount)))
      .map((entry) => entry.idx);

    this.secondaryIndices = new Set(ranked);
  }

  private pickDominantByProduct(): number {
    // Dominante estructural fijo por producto.
    // Evita saltos por cambios de longitud/orden del grafo.
    if (!this.nodes.length) return 0;

    // Índices elegidos para N=22 (actual). Si cambia N, clamp protege.
    const clamp = (i: number) => Math.max(0, Math.min(this.nodes.length - 1, i));

    switch (this.productFocus) {
      case "core":
        return clamp(10);
      case "scenario":
      case "counterfactual":
        return clamp(4);
      case "risk":
      case "regime":
        return clamp(11);
      case "signal":
        return clamp(7);
      case "ledger":
        return clamp(15);
      case "integration":
      case "entropy":
        return clamp(17);
      default:
        return clamp(10);
    }
  }

  private focusCenter(): { x: number; y: number } | null {
    switch (this.productFocus) {
      case "core":
        return { x: this.width * 0.5, y: this.height * 0.52 };
      case "counterfactual":
      case "scenario":
        return { x: this.width * 0.32, y: this.height * 0.38 };
      case "regime":
      case "risk":
        return { x: this.width * 0.34, y: this.height * 0.58 };
      case "signal":
        return { x: this.width * 0.58, y: this.height * 0.34 };
      case "ledger":
        return { x: this.width * 0.68, y: this.height * 0.58 };
      case "integration":
      default:
      case "entropy":
        return { x: this.width * 0.54, y: this.height * 0.62 };
    }
  }

  private drawConnections(cfg: RegimeConfig): void {
    const threshold =
      cfg.lineDistance -
      this.productBlend * 16 +
      this.profileCurrent.densityShift * this.productBlend * 0.4;
    const thresholdSq = threshold * threshold;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const b = this.nodes[j];
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
        const isActive = aSecondary || bSecondary;

        const scrollDominance = clamp(this.smoothedProgress * SCROLL_DOMINANCE_MULTIPLIER, 0, 0.65);
        const dominantMultiplier =
          this.dominantWeight +
          scrollDominance +
          this.profileCurrent.dominantBoost * this.productBlend;
        let alpha =
          cfg.latentLineAlpha *
          t *
          Math.max(0.12, this.latentWeight + this.profileCurrent.latentBoost * this.productBlend);
        let lineColor = this.fieldLineLatent;
        const strokeBoost = this.profileCurrent.strokeBoost * this.productBlend;
        const lineWidth =
          (isDominant
            ? STROKE_DOMINANT
            : isActive
              ? STROKE_ACTIVE
              : STROKE_BASE) +
          strokeBoost * (isDominant ? 1.1 : isActive ? 0.8 : 0.5);

        if (isDominant) {
          alpha = 0.4 * t * dominantMultiplier;
          lineColor = this.fieldDominant;
        } else if (isActive) {
          alpha =
            0.28 *
            t *
            (this.secondaryWeight + this.profileCurrent.secondaryBoost * this.productBlend);
          lineColor = this.fieldLineActive;
        }

        alpha *= 1 + this.profileCurrent.opacityBoost * this.productBlend;

        if (this.algorithm === "signal" && !isDominant && !isActive) {
          continue;
        }

        this.ctx.globalAlpha = clamp(alpha, 0, 1);
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }
    this.ctx.globalAlpha = 1;
  }

  private drawNodes(): void {
    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const isDominant = i === this.dominantIndex;
      const isSecondary = this.secondaryIndices.has(i);

      let radius = 1.8;
      let color = this.fieldNodeLatent;
      let multiplier = this.latentWeight + this.profileCurrent.latentBoost * this.productBlend;
      const baseWeight = 1;

      if (isDominant) {
        radius = 3.6;
        color = this.fieldNodeDominant;
        multiplier =
          this.dominantWeight +
          clamp(this.smoothedProgress * SCROLL_DOMINANCE_MULTIPLIER, 0, 0.65) +
          this.profileCurrent.dominantBoost * this.productBlend;
      } else if (isSecondary) {
        radius = 2.5;
        color = this.fieldNodeActive;
        multiplier = this.secondaryWeight + this.profileCurrent.secondaryBoost * this.productBlend;
      }

      radius += this.profileCurrent.strokeBoost * this.productBlend * (isDominant ? 1.2 : isSecondary ? 0.8 : 0.4);
      const weight = baseWeight * multiplier * (1 + this.profileCurrent.opacityBoost * this.productBlend);
      this.ctx.globalAlpha = clamp(weight, 0, 1);
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
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
