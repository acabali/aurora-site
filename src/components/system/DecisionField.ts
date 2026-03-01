import type { Regime } from "../../lib/regimeController";

type FieldAlgorithm = "core" | "scenario" | "risk" | "signal" | "ledger" | "integration";
type FieldFocus = "dominant" | "dependencies" | "signal" | null;

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  mass: number;
};

type RiskZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number;
};

type FieldMetrics = {
  dominancePct: number;
  dominantIndex: number;
  clusterCount: number;
  convergence: { x: number; y: number; magnitude: number };
  latencyFactor: number;
  riskZones: RiskZone[];
};

type RegimeConfig = {
  density: number;
  velocity: number;
  dominance: number;
  clustering: number;
  gravity: number;
  lineDistance: number;
  lineAlpha: number;
  instability: number;
};

const RAF_KEY = "__auroraDecisionFieldController";
const MOBILE_BREAKPOINT = 768;
const MIN_NODES = 46;
const MAX_NODES = 130;
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

const REGIME_CONFIG: Record<Regime, RegimeConfig> = {
  unstable: {
    density: 0.98,
    velocity: 1,
    dominance: 0.22,
    clustering: 0.22,
    gravity: 0.0005,
    lineDistance: 136,
    lineAlpha: 0.16,
    instability: 0.95,
  },
  compressing: {
    density: 1.06,
    velocity: 0.86,
    dominance: 0.34,
    clustering: 0.36,
    gravity: 0.0009,
    lineDistance: 132,
    lineAlpha: 0.14,
    instability: 0.72,
  },
  collision: {
    density: 1.12,
    velocity: 1.05,
    dominance: 0.44,
    clustering: 0.42,
    gravity: 0.0007,
    lineDistance: 140,
    lineAlpha: 0.19,
    instability: 1.04,
  },
  rupture: {
    density: 1,
    velocity: 0.3,
    dominance: 0.78,
    clustering: 0.88,
    gravity: 0.0019,
    lineDistance: 118,
    lineAlpha: 0.07,
    instability: 0.16,
  },
  reordering: {
    density: 0.84,
    velocity: 0.58,
    dominance: 0.72,
    clustering: 0.82,
    gravity: 0.0014,
    lineDistance: 126,
    lineAlpha: 0.11,
    instability: 0.28,
  },
  stabilized: {
    density: 0.72,
    velocity: 0.34,
    dominance: 0.92,
    clustering: 0.94,
    gravity: 0.0018,
    lineDistance: 116,
    lineAlpha: 0.08,
    instability: 0.08,
  },
};

const PHASE_LABEL: Record<Regime, string> = {
  unstable: "dinámico/unstable",
  compressing: "dinámico/compressing",
  collision: "dinámico/collision",
  rupture: "dinámico/rupture",
  reordering: "dinámico/reordering",
  stabilized: "dinámico/stabilized",
};

class DecisionFieldController {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLDivElement;
  private readonly logoNode: HTMLDivElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly nodes: NodePoint[] = [];

  private regime: Regime = "unstable";
  private algorithm: FieldAlgorithm = "core";
  private focusMode: FieldFocus = null;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private raf = 0;
  private reducedMotion = false;
  private scrollVelocity = 0;
  private lastScrollY = 0;
  private stateEnteredAt = 0;
  private ruptureFreezeUntil = 0;
  private ruptureReorganized = false;
  private nextMetricsAt = 0;
  private nextOverlayAt = 0;
  private logoX = 0;
  private logoY = 0;

  private metrics: FieldMetrics = {
    dominancePct: 0,
    dominantIndex: 0,
    clusterCount: 1,
    convergence: { x: 0, y: 0, magnitude: 0 },
    latencyFactor: 0,
    riskZones: [],
  };

  private cursor = {
    active: false,
    x: 0,
    y: 0,
  };

  private readonly mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly mutationObserver = new MutationObserver(() => this.syncBodyState());

  private readonly onResize = () => {
    this.syncSize();
    this.ensureNodeCount();
    this.clampNodes();
    this.render(performance.now());
  };

  private readonly onScroll = () => {
    const y = window.scrollY;
    const delta = y - this.lastScrollY;
    this.lastScrollY = y;
    this.scrollVelocity = this.scrollVelocity * 0.82 + delta * 0.18;
  };

  private readonly onVisibility = () => {
    if (document.visibilityState === "visible") {
      this.start();
      return;
    }
    this.stop();
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

  private readonly onPointerMove = (event: PointerEvent) => {
    this.cursor.active = true;
    this.cursor.x = event.clientX;
    this.cursor.y = event.clientY;
  };

  private readonly onPointerLeave = () => {
    this.cursor.active = false;
  };

  private readonly frame = (time: number) => {
    this.raf = window.requestAnimationFrame(this.frame);
    this.render(time);
  };

  constructor(root: HTMLElement) {
    this.root = root;

    const ctx = document.createElement("canvas").getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("DecisionField: Canvas 2D context unavailable.");
    }

    this.ctx = ctx;
    this.canvas = this.ctx.canvas;
    this.canvas.className = "decision-field-canvas";
    this.canvas.setAttribute("aria-hidden", "true");

    this.overlay = document.createElement("div");
    this.overlay.className = "decision-field-overlay";
    this.overlay.setAttribute("aria-hidden", "true");

    this.logoNode = document.createElement("div");
    this.logoNode.className = "decision-field-logo-node";
    this.logoNode.setAttribute("aria-hidden", "true");

    this.root.appendChild(this.canvas);
    this.root.appendChild(this.logoNode);
    this.root.appendChild(this.overlay);

    this.reducedMotion = this.mediaQuery.matches;
    this.syncBodyState();
    this.stateEnteredAt = performance.now();
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
    window.removeEventListener("scroll", this.onScroll, true);
    window.removeEventListener("pointermove", this.onPointerMove, true);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.mediaQuery.removeEventListener("change", this.onReduceMotionChange);
    this.mutationObserver.disconnect();

    delete document.body.dataset.logoDocked;

    this.root.innerHTML = "";
  }

  private bind(): void {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("scroll", this.onScroll, { passive: true, capture: true });
    window.addEventListener("pointermove", this.onPointerMove, { passive: true, capture: true });
    window.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    this.mediaQuery.addEventListener("change", this.onReduceMotionChange);

    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-regime", "data-state", "data-algorithm", "data-field-focus", "data-binary-side"],
    });
  }

  private syncBodyState(): void {
    const nextRegime = this.readRegime();
    const nextAlgorithm = this.readAlgorithm();
    const nextFocus = this.readFocus();

    if (nextRegime !== this.regime) {
      this.regime = nextRegime;
      this.stateEnteredAt = performance.now();
      this.ensureNodeCount();

      if (nextRegime === "rupture") {
        this.ruptureFreezeUntil = this.stateEnteredAt + 300;
        this.ruptureReorganized = false;
      }

      this.nextMetricsAt = 0;
      this.nextOverlayAt = 0;
    }

    this.algorithm = nextAlgorithm;
    this.focusMode = nextFocus;
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

  private readFocus(): FieldFocus {
    const raw = (document.body.dataset.fieldFocus ?? "").trim();
    if (raw === "dominant" || raw === "dependencies" || raw === "signal") {
      return raw;
    }
    return null;
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

  private computeNodeTarget(): number {
    const area = this.width * this.height;
    const cfg = REGIME_CONFIG[this.regime];
    let target = Math.round((area / 11800) * cfg.density);

    if (this.width < MOBILE_BREAKPOINT) {
      target = Math.round(target * 0.7);
    }

    return Math.min(MAX_NODES, Math.max(MIN_NODES, target));
  }

  private ensureNodeCount(): void {
    const target = this.computeNodeTarget();

    while (this.nodes.length < target) {
      this.nodes.push(this.createNode());
    }

    if (this.nodes.length > target) {
      this.nodes.length = target;
    }
  }

  private createNode(): NodePoint {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      seed: Math.random() * Math.PI * 2,
      mass: 0.75 + Math.random() * 0.65,
    };
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

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(cfg);

    this.updateNodes(time, cfg);

    if (time >= this.nextMetricsAt) {
      this.sampleMetrics(cfg, time);
      this.nextMetricsAt = time + 120;
    }

    const frozen = this.regime === "rupture" && time < this.ruptureFreezeUntil;

    if (!frozen) {
      this.drawRiskZones();
      this.drawConnections(cfg);
      this.drawNodes(cfg, time);
      this.drawConvergenceVector();
    }

    this.drawRuptureMask(time);
    this.updateLogoNode();

    if (time >= this.nextOverlayAt) {
      this.updateOverlay();
      this.nextOverlayAt = time + 200;
    }

    this.scrollVelocity *= 0.88;
  }

  private drawBackground(cfg: RegimeConfig): void {
    const velocityEnergy = Math.min(1, Math.abs(this.scrollVelocity) / 34);
    const alpha = 0.1 + velocityEnergy * 0.08 + cfg.instability * 0.04;

    this.ctx.fillStyle = `rgba(5, 10, 16, ${alpha.toFixed(3)})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private updateNodes(time: number, cfg: RegimeConfig): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const dominant = this.nodes[this.metrics.dominantIndex] ?? { x: centerX, y: centerY };

    if (this.regime === "rupture" && time < this.ruptureFreezeUntil) {
      for (const n of this.nodes) {
        n.vx *= 0.12;
        n.vy *= 0.12;
      }
      return;
    }

    if (this.regime === "rupture" && !this.ruptureReorganized) {
      this.forceConvergence(centerX, centerY);
      this.ruptureReorganized = true;
    }

    const scenarioAttractors = [
      { x: this.width * 0.24, y: this.height * 0.3 },
      { x: this.width * 0.74, y: this.height * 0.36 },
      { x: this.width * 0.5, y: this.height * 0.72 },
    ];

    const riskAttractors = [
      { x: this.width * 0.18, y: this.height * 0.66 },
      { x: this.width * 0.72, y: this.height * 0.26 },
      { x: this.width * 0.8, y: this.height * 0.76 },
    ];

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      const noiseScalar = this.algorithm === "signal" ? 0.26 : 1;
      const jitter = cfg.instability * cfg.velocity * noiseScalar;

      const baseNoiseX = Math.sin(time * 0.0008 + n.seed) * 0.08 * jitter;
      const baseNoiseY = Math.cos(time * 0.0006 + n.seed * 1.4) * 0.08 * jitter;
      n.vx += baseNoiseX;
      n.vy += baseNoiseY;

      const gravityX = (centerX - n.x) * cfg.gravity;
      const gravityY = (centerY - n.y) * cfg.gravity;
      n.vx += gravityX;
      n.vy += gravityY;

      if (this.regime === "unstable") {
        n.vx += (Math.random() - 0.5) * 0.11;
        n.vy += (Math.random() - 0.5) * 0.11;
      } else if (this.regime === "compressing") {
        n.vx += (centerX - n.x) * 0.0012;
        n.vy += (centerY - n.y) * 0.0012;
      } else if (this.regime === "collision") {
        const side = n.x < centerX ? -1 : 1;
        n.vx += side * 0.03 + (Math.random() - 0.5) * 0.04;
        n.vy += Math.sin(time * 0.0012 + n.seed) * 0.04;
      } else if (this.regime === "rupture") {
        n.vx += (centerX - n.x) * 0.0032;
        n.vy += (centerY - n.y) * 0.0032;
      } else if (this.regime === "reordering") {
        n.vx += (dominant.x - n.x) * 0.0016;
        n.vy += (dominant.y - n.y) * 0.0016;
      } else if (this.regime === "stabilized") {
        n.vx += (dominant.x - n.x) * 0.0012;
        n.vy += (dominant.y - n.y) * 0.0012;
      }

      if (this.algorithm === "core") {
        n.vx += (centerX - n.x) * 0.0014;
        n.vy += (centerY - n.y) * 0.0014;
      }

      if (this.algorithm === "scenario") {
        const target = scenarioAttractors[i % scenarioAttractors.length];
        n.vx += (target.x - n.x) * 0.0017;
        n.vy += (target.y - n.y) * 0.0017;
      }

      if (this.algorithm === "risk") {
        const target = riskAttractors[i % riskAttractors.length];
        n.vx += (target.x - n.x) * 0.0019;
        n.vy += (target.y - n.y) * 0.0019;
      }

      if (this.algorithm === "signal") {
        n.vx *= 0.84;
        n.vy *= 0.84;
      }

      if (this.algorithm === "ledger") {
        const laneY = this.height * (0.26 + (i % 4) * 0.16);
        n.vy += (laneY - n.y) * 0.002;
      }

      if (this.algorithm === "integration") {
        const targetX = this.width * (0.24 + 0.52 * (n.y / this.height));
        n.vx += (targetX - n.x) * 0.0015;
      }

      if (this.cursor.active && !this.reducedMotion) {
        const dx = n.x - this.cursor.x;
        const dy = n.y - this.cursor.y;
        const distSq = dx * dx + dy * dy;
        const radius = 148;
        const radiusSq = radius * radius;

        if (distSq < radiusSq) {
          const dist = Math.sqrt(Math.max(0.001, distSq));
          const influence = (1 - dist / radius) * 0.22 * n.mass;
          n.vx += (dx / dist) * influence;
          n.vy += (dy / dist) * influence;
        }
      }

      const sideBias = document.body.dataset.binarySide;
      if (sideBias === "entropy") {
        if (n.x < centerX) {
          n.vx += (Math.random() - 0.5) * 0.14;
          n.vy += (Math.random() - 0.5) * 0.14;
        }
      }

      if (sideBias === "center") {
        const poleX = this.width * 0.68;
        n.vx += (poleX - n.x) * 0.0018;
        n.vy += (centerY - n.y) * 0.0016;
      }

      if (this.focusMode === "dominant") {
        n.vx += (dominant.x - n.x) * 0.0014;
        n.vy += (dominant.y - n.y) * 0.0014;
      }

      if (this.focusMode === "signal") {
        n.vx *= 0.9;
        n.vy *= 0.9;
      }

      n.vx *= 0.94;
      n.vy *= 0.94;

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) {
        n.x = 0;
        n.vx *= -0.65;
      } else if (n.x > this.width) {
        n.x = this.width;
        n.vx *= -0.65;
      }

      if (n.y < 0) {
        n.y = 0;
        n.vy *= -0.65;
      } else if (n.y > this.height) {
        n.y = this.height;
        n.vy *= -0.65;
      }
    }
  }

  private forceConvergence(centerX: number, centerY: number): void {
    for (const node of this.nodes) {
      node.x = node.x * 0.28 + centerX * 0.72 + (Math.random() - 0.5) * 14;
      node.y = node.y * 0.28 + centerY * 0.72 + (Math.random() - 0.5) * 14;
      node.vx *= 0.18;
      node.vy *= 0.18;
    }
  }

  private sampleMetrics(cfg: RegimeConfig, time: number): void {
    const n = this.nodes.length;
    if (n === 0) return;

    const threshold = cfg.lineDistance;
    const thresholdSq = threshold * threshold;

    const degrees = new Array<number>(n).fill(0);
    const adjacency: number[][] = Array.from({ length: n }, () => []);

    for (let i = 0; i < n; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < n; j += 1) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > thresholdSq) continue;
        degrees[i] += 1;
        degrees[j] += 1;
        adjacency[i].push(j);
        adjacency[j].push(i);
      }
    }

    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const maxCenterDist = Math.max(1, Math.hypot(centerX, centerY));

    let dominantIndex = 0;
    let dominantScore = -1;

    for (let i = 0; i < n; i += 1) {
      const node = this.nodes[i];
      const centerBias = 1 - Math.min(1, Math.hypot(node.x - centerX, node.y - centerY) / maxCenterDist);
      const score = degrees[i] + centerBias * cfg.dominance * 10;
      if (score > dominantScore) {
        dominantScore = score;
        dominantIndex = i;
      }
    }

    const dominantDegree = degrees[dominantIndex] ?? 0;
    const dominancePct = n > 1 ? (dominantDegree / (n - 1)) * 100 : 0;

    const visited = new Array<boolean>(n).fill(false);
    let clusterCount = 0;

    for (let i = 0; i < n; i += 1) {
      if (visited[i]) continue;
      clusterCount += 1;
      const queue = [i];
      visited[i] = true;

      while (queue.length > 0) {
        const idx = queue.shift();
        if (idx === undefined) break;

        for (const next of adjacency[idx]) {
          if (visited[next]) continue;
          visited[next] = true;
          queue.push(next);
        }
      }
    }

    const dominant = this.nodes[dominantIndex];
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < n; i += 1) {
      if (i === dominantIndex) continue;
      sumX += dominant.x - this.nodes[i].x;
      sumY += dominant.y - this.nodes[i].y;
    }

    const rawMagnitude = Math.hypot(sumX, sumY);
    const denom = Math.max(1, n * 160);
    const convergenceMagnitude = Math.min(1, rawMagnitude / denom);
    const convergence =
      rawMagnitude > 0
        ? { x: sumX / rawMagnitude, y: sumY / rawMagnitude, magnitude: convergenceMagnitude }
        : { x: 0, y: 0, magnitude: 0 };

    const zones = this.computeRiskZones();

    const transitionAge = Math.max(1, time - this.stateEnteredAt);
    const kinetic = this.averageKineticEnergy();
    const velocityFactor = Math.min(1, Math.abs(this.scrollVelocity) / 26);
    const kineticFactor = Math.min(1, kinetic / 1.9);
    const transitionFactor = Math.max(0, 1 - transitionAge / 900);
    const latencyFactor = Math.min(1, velocityFactor * 0.45 + kineticFactor * 0.35 + transitionFactor * 0.2);

    this.metrics = {
      dominancePct,
      dominantIndex,
      clusterCount,
      convergence,
      latencyFactor,
      riskZones: zones,
    };
  }

  private computeRiskZones(): RiskZone[] {
    const cols = 3;
    const rows = 2;
    const zoneWidth = this.width / cols;
    const zoneHeight = this.height / rows;

    const zones = new Array<number>(cols * rows).fill(0);

    for (const node of this.nodes) {
      const col = Math.min(cols - 1, Math.max(0, Math.floor(node.x / zoneWidth)));
      const row = Math.min(rows - 1, Math.max(0, Math.floor(node.y / zoneHeight)));
      zones[row * cols + col] += 1;
    }

    const max = Math.max(1, ...zones);

    return zones
      .map((count, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          x: col * zoneWidth,
          y: row * zoneHeight,
          w: zoneWidth,
          h: zoneHeight,
          intensity: count / max,
        };
      })
      .filter((zone) => zone.intensity >= 0.58)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 2);
  }

  private averageKineticEnergy(): number {
    if (this.nodes.length === 0) return 0;
    let sum = 0;
    for (const node of this.nodes) {
      sum += Math.hypot(node.vx, node.vy);
    }
    return sum / this.nodes.length;
  }

  private drawRiskZones(): void {
    const showZones = this.algorithm === "risk" || this.regime === "collision" || this.regime === "rupture";
    if (!showZones) return;

    for (const zone of this.metrics.riskZones) {
      const alpha = 0.08 + zone.intensity * 0.1;
      this.ctx.fillStyle = `rgba(208, 74, 74, ${alpha.toFixed(3)})`;
      this.ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    }
  }

  private drawConnections(cfg: RegimeConfig): void {
    const maxDistance = cfg.lineDistance;
    const maxDistanceSq = maxDistance * maxDistance;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > maxDistanceSq) continue;

        const dist = Math.sqrt(distSq);
        const t = 1 - dist / maxDistance;
        let rgb = "160, 226, 214";

        if (this.algorithm === "risk" || this.regime === "rupture") {
          rgb = "222, 90, 90";
        } else if (this.algorithm === "scenario") {
          rgb = "214, 168, 94";
        } else if (this.algorithm === "ledger") {
          rgb = "110, 178, 202";
        }

        if (this.focusMode === "dependencies") {
          rgb = "240, 246, 255";
        }

        const alpha = cfg.lineAlpha * t;
        this.ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        this.ctx.lineWidth = this.algorithm === "integration" ? 1.15 : 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNodes(cfg: RegimeConfig, time: number): void {
    const dominantIndex = this.metrics.dominantIndex;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const pulse = 0.5 + Math.sin(time * 0.001 + node.seed) * 0.24;
      const baseRadius = i === dominantIndex ? 2.4 : 1.1;
      const radius = baseRadius + pulse * 0.24;

      let rgb = "170, 236, 220";
      if (this.algorithm === "risk" || this.regime === "rupture") rgb = "228, 102, 102";
      if (this.algorithm === "scenario") rgb = "242, 196, 116";
      if (this.algorithm === "ledger") rgb = "126, 195, 214";

      let alpha = 0.3 + pulse * 0.16;
      if (i === dominantIndex) {
        alpha = 0.78;
      }

      if (this.focusMode === "signal" && i !== dominantIndex) {
        alpha *= 0.62;
      }

      this.ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const dominant = this.nodes[dominantIndex];
    if (dominant) {
      this.ctx.strokeStyle = "rgba(234, 246, 255, 0.44)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(dominant.x, dominant.y, 8, 0, Math.PI * 2);
      this.ctx.stroke();

      if (this.focusMode === "dominant") {
        this.ctx.strokeStyle = "rgba(248, 252, 255, 0.64)";
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(dominant.x, dominant.y, 13, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  private drawConvergenceVector(): void {
    const vector = this.metrics.convergence;
    if (vector.magnitude < 0.05) return;

    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const length = 48 + vector.magnitude * 72;

    this.ctx.strokeStyle = "rgba(232, 240, 248, 0.36)";
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX + vector.x * length, centerY + vector.y * length);
    this.ctx.stroke();
  }

  private drawRuptureMask(time: number): void {
    if (this.regime !== "rupture") return;

    if (time < this.ruptureFreezeUntil) {
      this.ctx.fillStyle = "rgba(2, 4, 8, 0.36)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }

    this.ctx.fillStyle = "rgba(8, 14, 20, 0.1)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private updateOverlay(): void {
    const dominance = this.metrics.dominancePct.toFixed(1);
    const latency = Math.round(this.metrics.latencyFactor * 100);

    this.overlay.innerHTML = `<span>PROTOCOLO v1.0</span><span>REGIME: ${PHASE_LABEL[this.regime]}</span><span>DOMINANCE: ${dominance}%</span><span>CLUSTERING: ${this.metrics.clusterCount}</span><span>LATENCY: ${latency}%</span>`;
    this.overlay.classList.add("is-visible");
  }

  private updateLogoNode(): void {
    const dominant = this.nodes[this.metrics.dominantIndex];

    if (this.regime !== "stabilized" || !dominant) {
      this.logoNode.classList.remove("is-visible");
      delete document.body.dataset.logoDocked;
      return;
    }

    if (!this.logoNode.classList.contains("is-visible")) {
      this.logoX = dominant.x;
      this.logoY = dominant.y;
    }

    this.logoX = this.logoX * 0.86 + dominant.x * 0.14;
    this.logoY = this.logoY * 0.86 + dominant.y * 0.14;

    this.logoNode.style.transform = `translate3d(${(this.logoX - 16).toFixed(2)}px, ${(this.logoY - 16).toFixed(2)}px, 0)`;
    this.logoNode.classList.add("is-visible");
    document.body.dataset.logoDocked = "true";
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
