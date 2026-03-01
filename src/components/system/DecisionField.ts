export type DecisionFieldState =
  | "hero"
  | "change"
  | "rupture"
  | "stabilized"
  | "capability-core"
  | "capability-scenario"
  | "capability-risk"
  | "capability-signal"
  | "capability-ledger"
  | "capability-growth"
  | "capability-cost"
  | "capability-cash"
  | "capability-pricing"
  | "capability-expansion"
  | "capability-integration"
  | "binary-before"
  | "binary-after"
  | "demo-standard";

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  seed: number;
  mass: number;
};

type Pulse = {
  x: number;
  y: number;
  radius: number;
  power: number;
  life: number;
};

type StateConfig = {
  density: number;
  jitter: number;
  drag: number;
  lineDistance: number;
  lineAlpha: number;
  instability: number;
  cursorForce: number;
  anchorPull: number;
  centerPull: number;
  splitBias: number;
  voidRadius: number;
  criticality: number;
};

const MIN_PARTICLES = 40;
const MAX_PARTICLES = 118;
const MOBILE_BREAKPOINT = 768;
const RAF_KEY = "__auroraDecisionField";

const COLORS = {
  stable: "0,218,183",
  tension: "255,181,89",
  risk: "255,102,102",
  structure: "16,28,44",
};

const FIELD_OVERRIDE_TO_STATE: Record<string, DecisionFieldState> = {
  core: "capability-core",
  scenario: "capability-scenario",
  risk: "capability-risk",
  signal: "capability-signal",
  ledger: "capability-ledger",
  integration: "capability-integration",
  growth: "capability-growth",
  cost: "capability-cost",
  cash: "capability-cash",
  pricing: "capability-pricing",
  expansion: "capability-expansion",
};

const STATE_PHASE_BY_STATE: Partial<Record<DecisionFieldState, string>> = {
  hero: "EXPANSION",
  change: "TENSION",
  rupture: "RUPTURA",
  stabilized: "REORDENANDO",
  "capability-core": "REORDENANDO",
  "capability-scenario": "TENSION",
  "capability-risk": "RUPTURA",
  "capability-signal": "REORDENANDO",
  "capability-ledger": "REORDENANDO",
  "capability-growth": "EXPANSION",
  "capability-cost": "TENSION",
  "capability-cash": "RUPTURA",
  "capability-pricing": "TENSION",
  "capability-expansion": "EXPANSION",
  "capability-integration": "REORDENANDO",
  "binary-before": "RUPTURA",
  "binary-after": "REORDENANDO",
  "demo-standard": "REORDENANDO",
};

const BASE_STATE_CONFIG: Record<DecisionFieldState, StateConfig> = {
  hero: {
    density: 0.62,
    jitter: 0.06,
    drag: 0.988,
    lineDistance: 126,
    lineAlpha: 0.12,
    instability: 0.02,
    cursorForce: 0.36,
    anchorPull: 0.0022,
    centerPull: 0.0011,
    splitBias: 0,
    voidRadius: 0.38,
    criticality: 0.2,
  },
  change: {
    density: 0.72,
    jitter: 0.08,
    drag: 0.984,
    lineDistance: 132,
    lineAlpha: 0.15,
    instability: 0.03,
    cursorForce: 0.42,
    anchorPull: 0.0018,
    centerPull: 0.001,
    splitBias: 0,
    voidRadius: 0.3,
    criticality: 0.38,
  },
  rupture: {
    density: 0.56,
    jitter: 0.02,
    drag: 0.994,
    lineDistance: 108,
    lineAlpha: 0.07,
    instability: 0.01,
    cursorForce: 0.22,
    anchorPull: 0.0024,
    centerPull: 0.0018,
    splitBias: 0.14,
    voidRadius: 0.2,
    criticality: 0.72,
  },
  stabilized: {
    density: 0.46,
    jitter: 0.01,
    drag: 0.992,
    lineDistance: 122,
    lineAlpha: 0.1,
    instability: 0.01,
    cursorForce: 0.24,
    anchorPull: 0.0032,
    centerPull: 0.0019,
    splitBias: 0,
    voidRadius: 0.44,
    criticality: 0.08,
  },
  "capability-core": {
    density: 0.54,
    jitter: 0.02,
    drag: 0.991,
    lineDistance: 124,
    lineAlpha: 0.12,
    instability: 0.01,
    cursorForce: 0.26,
    anchorPull: 0.0028,
    centerPull: 0.0021,
    splitBias: 0,
    voidRadius: 0.46,
    criticality: 0.1,
  },
  "capability-scenario": {
    density: 0.78,
    jitter: 0.06,
    drag: 0.985,
    lineDistance: 128,
    lineAlpha: 0.15,
    instability: 0.03,
    cursorForce: 0.34,
    anchorPull: 0.002,
    centerPull: 0.0011,
    splitBias: 0,
    voidRadius: 0.3,
    criticality: 0.48,
  },
  "capability-risk": {
    density: 1.02,
    jitter: 0.11,
    drag: 0.976,
    lineDistance: 136,
    lineAlpha: 0.2,
    instability: 0.05,
    cursorForce: 0.46,
    anchorPull: 0.0014,
    centerPull: 0.0007,
    splitBias: 0.24,
    voidRadius: 0.15,
    criticality: 0.9,
  },
  "capability-signal": {
    density: 0.5,
    jitter: 0.01,
    drag: 0.993,
    lineDistance: 118,
    lineAlpha: 0.08,
    instability: 0.004,
    cursorForce: 0.2,
    anchorPull: 0.0031,
    centerPull: 0.0017,
    splitBias: 0,
    voidRadius: 0.48,
    criticality: 0.12,
  },
  "capability-ledger": {
    density: 0.64,
    jitter: 0.02,
    drag: 0.99,
    lineDistance: 126,
    lineAlpha: 0.12,
    instability: 0.01,
    cursorForce: 0.28,
    anchorPull: 0.0026,
    centerPull: 0.0015,
    splitBias: 0,
    voidRadius: 0.42,
    criticality: 0.16,
  },
  "capability-growth": {
    density: 0.74,
    jitter: 0.05,
    drag: 0.986,
    lineDistance: 130,
    lineAlpha: 0.14,
    instability: 0.03,
    cursorForce: 0.32,
    anchorPull: 0.0022,
    centerPull: 0.0012,
    splitBias: 0,
    voidRadius: 0.32,
    criticality: 0.34,
  },
  "capability-cost": {
    density: 0.84,
    jitter: 0.07,
    drag: 0.982,
    lineDistance: 132,
    lineAlpha: 0.17,
    instability: 0.04,
    cursorForce: 0.38,
    anchorPull: 0.0018,
    centerPull: 0.001,
    splitBias: 0.16,
    voidRadius: 0.24,
    criticality: 0.52,
  },
  "capability-cash": {
    density: 0.96,
    jitter: 0.1,
    drag: 0.978,
    lineDistance: 134,
    lineAlpha: 0.19,
    instability: 0.05,
    cursorForce: 0.44,
    anchorPull: 0.0016,
    centerPull: 0.0009,
    splitBias: 0.2,
    voidRadius: 0.19,
    criticality: 0.7,
  },
  "capability-pricing": {
    density: 0.82,
    jitter: 0.07,
    drag: 0.983,
    lineDistance: 132,
    lineAlpha: 0.16,
    instability: 0.04,
    cursorForce: 0.35,
    anchorPull: 0.0019,
    centerPull: 0.001,
    splitBias: 0.1,
    voidRadius: 0.24,
    criticality: 0.46,
  },
  "capability-expansion": {
    density: 0.78,
    jitter: 0.05,
    drag: 0.985,
    lineDistance: 130,
    lineAlpha: 0.14,
    instability: 0.03,
    cursorForce: 0.31,
    anchorPull: 0.0021,
    centerPull: 0.0011,
    splitBias: 0.08,
    voidRadius: 0.29,
    criticality: 0.32,
  },
  "capability-integration": {
    density: 0.88,
    jitter: 0.06,
    drag: 0.984,
    lineDistance: 138,
    lineAlpha: 0.18,
    instability: 0.03,
    cursorForce: 0.33,
    anchorPull: 0.002,
    centerPull: 0.0011,
    splitBias: 0,
    voidRadius: 0.28,
    criticality: 0.4,
  },
  "binary-before": {
    density: 0.9,
    jitter: 0.12,
    drag: 0.977,
    lineDistance: 140,
    lineAlpha: 0.2,
    instability: 0.05,
    cursorForce: 0.42,
    anchorPull: 0.0016,
    centerPull: 0.0008,
    splitBias: 0.34,
    voidRadius: 0.2,
    criticality: 0.68,
  },
  "binary-after": {
    density: 0.48,
    jitter: 0.01,
    drag: 0.993,
    lineDistance: 120,
    lineAlpha: 0.1,
    instability: 0.01,
    cursorForce: 0.22,
    anchorPull: 0.0032,
    centerPull: 0.002,
    splitBias: 0,
    voidRadius: 0.5,
    criticality: 0.08,
  },
  "demo-standard": {
    density: 0.42,
    jitter: 0.008,
    drag: 0.994,
    lineDistance: 116,
    lineAlpha: 0.08,
    instability: 0.004,
    cursorForce: 0.18,
    anchorPull: 0.0034,
    centerPull: 0.0022,
    splitBias: 0,
    voidRadius: 0.54,
    criticality: 0.04,
  },
};

class DecisionFieldController {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLDivElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly nodes: NodePoint[] = [];
  private readonly pulses: Pulse[] = [];

  private raf = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private state: DecisionFieldState = "hero";
  private scrollRatio = 0;
  private scrollVelocity = 0;
  private lastScrollY = 0;
  private reducedMotion = false;
  private nextOverlaySync = 0;
  private lastHoverTarget: HTMLElement | null = null;
  private lastHoverPulseTs = 0;
  private stateEnteredAt = 0;

  private cursor = {
    active: false,
    x: 0,
    y: 0,
  };

  private readonly onResize = () => {
    this.syncSize();
    this.ensureNodeCount();
    this.clampNodes();
    this.render(performance.now());
  };

  private readonly onVisibility = () => {
    if (document.visibilityState === "visible") {
      this.start();
      return;
    }
    this.stop();
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    this.cursor.active = true;
    this.cursor.x = event.clientX;
    this.cursor.y = event.clientY;
  };

  private readonly onPointerLeave = () => {
    this.cursor.active = false;
  };

  private readonly onScroll = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = window.scrollY;
    this.scrollRatio = Math.min(1, Math.max(0, y / maxScroll));
    const delta = y - this.lastScrollY;
    this.scrollVelocity = Math.min(38, Math.abs(delta));
    this.lastScrollY = y;
  };

  private readonly onStateMutation = () => {
    const next = this.readBodyState();
    if (next === this.state) return;
    this.state = next;
    this.stateEnteredAt = performance.now();
    this.ensureNodeCount();
    this.nextOverlaySync = 0;
    this.updateOverlay();
    this.render(performance.now());
  };

  private readonly onActionHover = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest(
      "a,button,[role='button'],[data-capability-state],[data-binary-state],[data-product-item]"
    ) as
      | HTMLElement
      | null;
    if (!actionEl) return;

    const now = performance.now();
    if (this.lastHoverTarget === actionEl && now - this.lastHoverPulseTs < 120) return;

    this.lastHoverTarget = actionEl;
    this.lastHoverPulseTs = now;

    const rect = actionEl.getBoundingClientRect();
    this.emitPulse(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 14);
  };

  private readonly mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  private readonly onReduceMotionChange = () => {
    this.reducedMotion = this.mediaQuery.matches;
    if (this.reducedMotion) {
      this.stop();
      this.render(performance.now());
      return;
    }
    this.start();
  };

  private readonly mutationObserver = new MutationObserver(this.onStateMutation);

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
    this.canvas.setAttribute("role", "presentation");

    this.overlay = document.createElement("div");
    this.overlay.className = "decision-field-overlay";
    this.overlay.setAttribute("aria-hidden", "true");

    this.root.appendChild(this.canvas);
    this.root.appendChild(this.overlay);

    this.reducedMotion = this.mediaQuery.matches;
    this.state = this.readBodyState();
    this.stateEnteredAt = performance.now();
    this.syncSize();
    this.ensureNodeCount();
    this.bind();
    this.updateOverlay();

    if (!this.reducedMotion && document.visibilityState === "visible") {
      this.start();
    } else {
      this.render(performance.now());
    }
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove, true);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("scroll", this.onScroll, true);
    document.removeEventListener("visibilitychange", this.onVisibility);
    document.removeEventListener("pointerover", this.onActionHover, true);
    this.mediaQuery.removeEventListener("change", this.onReduceMotionChange);
    this.mutationObserver.disconnect();

    if (this.canvas.parentElement === this.root) {
      this.root.removeChild(this.canvas);
    }

    if (this.overlay.parentElement === this.root) {
      this.root.removeChild(this.overlay);
    }
  }

  private bind(): void {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true, capture: true });
    window.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
    window.addEventListener("scroll", this.onScroll, { passive: true, capture: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    document.addEventListener("pointerover", this.onActionHover, { passive: true, capture: true });
    this.mediaQuery.addEventListener("change", this.onReduceMotionChange);
    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-state", "data-field-override"],
    });
  }

  private readBodyState(): DecisionFieldState {
    const override = document.body.dataset.fieldOverride?.trim().toLowerCase();
    if (override && override in FIELD_OVERRIDE_TO_STATE) {
      return FIELD_OVERRIDE_TO_STATE[override];
    }

    const value = (document.body.dataset.state ?? "hero") as DecisionFieldState;
    if (value in BASE_STATE_CONFIG) return value;
    return "hero";
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

  private computeParticleTarget(): number {
    const area = this.width * this.height;
    let target = Math.round(area / 12400);

    if (this.width < MOBILE_BREAKPOINT) {
      target = Math.round(target * 0.72);
    }

    target = Math.round(target * BASE_STATE_CONFIG[this.state].density);
    return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, target));
  }

  private ensureNodeCount(): void {
    const target = this.computeParticleTarget();

    while (this.nodes.length < target) {
      this.nodes.push(this.createNode());
    }

    if (this.nodes.length > target) {
      this.nodes.length = target;
    }
  }

  private createNode(): NodePoint {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.26,
      vy: (Math.random() - 0.5) * 0.26,
      ox: x,
      oy: y,
      seed: Math.random() * Math.PI * 2,
      mass: 0.8 + Math.random() * 0.6,
    };
  }

  private clampNodes(): void {
    for (const node of this.nodes) {
      node.x = Math.min(this.width, Math.max(0, node.x));
      node.y = Math.min(this.height, Math.max(0, node.y));
      node.ox = Math.min(this.width, Math.max(0, node.ox));
      node.oy = Math.min(this.height, Math.max(0, node.oy));
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

  private emitPulse(x: number, y: number, power: number): void {
    this.pulses.push({ x, y, radius: 0, power, life: 1 });
    if (this.pulses.length > 10) this.pulses.shift();
  }

  private frame = (time: number): void => {
    this.raf = window.requestAnimationFrame(this.frame);
    this.render(time);
  };

  private render(time: number): void {
    const cfg = BASE_STATE_CONFIG[this.state];
    const ruptureElapsed = this.state === "rupture" ? time - this.stateEnteredAt : Number.POSITIVE_INFINITY;
    const inRuptureSilence = ruptureElapsed < 300;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = `rgba(${COLORS.structure}, ${this.state === "demo-standard" ? "0.08" : "0.16"})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.updatePulses();
    this.updateNodes(time, cfg, inRuptureSilence);

    if (!inRuptureSilence) {
      this.drawConnections(cfg, time);
      this.drawNodes(cfg, time);
    }
    this.drawRegime(cfg, inRuptureSilence);

    if (time >= this.nextOverlaySync) {
      this.updateOverlay();
      this.nextOverlaySync = time + 360;
    }

    this.scrollVelocity = Math.max(0, this.scrollVelocity * 0.9);
  }

  private updatePulses(): void {
    for (let i = this.pulses.length - 1; i >= 0; i -= 1) {
      const pulse = this.pulses[i];
      pulse.radius += 6;
      pulse.life -= 0.05;
      if (pulse.life <= 0) {
        this.pulses.splice(i, 1);
      }
    }
  }

  private updateNodes(time: number, cfg: StateConfig, inRuptureSilence: boolean): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const splitX = centerX;
    const rightPole = this.width * 0.68;
    const leftPole = this.width * 0.32;
    const scenarioCenters = [
      { x: this.width * 0.28, y: this.height * 0.36 },
      { x: this.width * 0.7, y: this.height * 0.42 },
      { x: this.width * 0.5, y: this.height * 0.72 },
    ];
    const riskZones = [
      { x: this.width * 0.22, y: this.height * 0.62 },
      { x: this.width * 0.76, y: this.height * 0.34 },
    ];
    const ledgerLanes = [this.height * 0.26, this.height * 0.5, this.height * 0.74];

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      let noiseScale = 1;
      if (this.state === "capability-signal" || this.state === "stabilized" || this.state === "demo-standard") {
        noiseScale = 0.35;
      }

      const localNoise =
        Math.sin(time * 0.0007 + n.seed) * cfg.jitter * 0.08 * noiseScale +
        Math.cos(time * 0.0009 + n.seed * 1.2) * cfg.jitter * 0.06 * noiseScale;

      n.vx += localNoise;
      n.vy += Math.sin(time * 0.0008 + n.seed) * cfg.jitter * 0.06 * noiseScale;

      if (this.cursor.active && !this.reducedMotion) {
        const dx = n.x - this.cursor.x;
        const dy = n.y - this.cursor.y;
        const distSq = dx * dx + dy * dy;
        const radius = 150 + this.scrollVelocity * 1.4;
        const radiusSq = radius * radius;

        if (distSq < radiusSq) {
          const dist = Math.sqrt(Math.max(0.001, distSq));
          const influence = (1 - dist / radius) * cfg.cursorForce * n.mass * 0.75;
          n.vx += (dx / dist) * influence;
          n.vy += (dy / dist) * influence;
        }
      }

      for (let p = 0; p < this.pulses.length; p += 1) {
        const pulse = this.pulses[p];
        const dx = n.x - pulse.x;
        const dy = n.y - pulse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const band = 20;
        const waveDelta = Math.abs(dist - pulse.radius);

        if (waveDelta < band) {
          const push = ((band - waveDelta) / band) * pulse.power * pulse.life * 0.006;
          const norm = dist > 0 ? 1 / dist : 0;
          n.vx += dx * norm * push;
          n.vy += dy * norm * push;
        }
      }

      if (this.state === "capability-core") {
        n.vx += (centerX - n.x) * 0.0022;
        n.vy += (centerY - n.y) * 0.0022;
      }

      if (this.state === "capability-scenario") {
        const target = scenarioCenters[i % scenarioCenters.length];
        n.vx += (target.x - n.x) * 0.0018;
        n.vy += (target.y - n.y) * 0.0018;
      }

      if (this.state === "capability-risk") {
        const target = riskZones[i % riskZones.length];
        n.vx += (target.x - n.x) * 0.0017;
        n.vy += (target.y - n.y) * 0.0017;
      }

      if (this.state === "capability-signal") {
        n.vx *= 0.84;
        n.vy *= 0.84;
      }

      if (this.state === "capability-ledger") {
        const lane = ledgerLanes[i % ledgerLanes.length];
        n.vy += (lane - n.y) * 0.0021;
      }

      if (this.state === "capability-integration") {
        const crossX = this.width * (0.2 + 0.6 * (n.y / this.height));
        n.vx += (crossX - n.x) * 0.0016;
        n.vy += (centerY - n.y) * 0.0011;
      }

      if (cfg.splitBias > 0 && this.state !== "rupture") {
        const onLeft = n.x < splitX;
        const chaos = cfg.splitBias * 0.07;
        n.vx += (Math.random() - 0.5) * chaos;
        n.vy += (Math.random() - 0.5) * chaos;
      }

      if (this.state === "binary-before") {
        const onLeft = n.x < centerX;
        if (onLeft) {
          n.vx += (Math.random() - 0.5) * 0.12;
          n.vy += (Math.random() - 0.5) * 0.12;
        } else {
          n.vx += (rightPole - n.x) * 0.0018;
          n.vy += (centerY - n.y) * 0.0018;
        }
      }

      if (this.state === "binary-after") {
        const poleX = n.x > centerX ? rightPole : leftPole;
        n.vx += (poleX - n.x) * 0.0013;
        n.vy += (centerY - n.y) * 0.0013;
      }

      if (this.state === "rupture") {
        n.vx *= 0.3;
        n.vy *= 0.3;
        n.vy += (centerY - n.y) * 0.0026;
        if (inRuptureSilence) {
          n.vx *= 0.68;
          n.vy *= 0.68;
        }
      }

      n.vx += (n.ox - n.x) * cfg.anchorPull;
      n.vy += (n.oy - n.y) * cfg.anchorPull;
      n.vx += (centerX - n.x) * cfg.centerPull;
      n.vy += (centerY - n.y) * cfg.centerPull;

      const scrollImpulse = (this.scrollRatio - 0.5) * 0.018;
      n.vx += scrollImpulse * n.mass;

      n.vx *= cfg.drag;
      n.vy *= cfg.drag;

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) {
        n.x = 0;
        n.vx *= -0.6;
      } else if (n.x > this.width) {
        n.x = this.width;
        n.vx *= -0.6;
      }

      if (n.y < 0) {
        n.y = 0;
        n.vy *= -0.6;
      } else if (n.y > this.height) {
        n.y = this.height;
        n.vy *= -0.6;
      }
    }
  }

  private drawConnections(cfg: StateConfig, time: number): void {
    const dynamicDistance = cfg.lineDistance * (0.94 + this.scrollRatio * 0.14);
    const maxDistSq = dynamicDistance * dynamicDistance;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > maxDistSq) continue;
        const skipGate = (Math.sin((i + 1) * (j + 1) + time * 0.0004) + 1) * 0.5;
        if (!this.reducedMotion && skipGate < cfg.instability * 0.6) continue;

        const dist = Math.sqrt(distSq);
        const t = 1 - dist / dynamicDistance;

        const leftSide = a.x < this.width * 0.5 || b.x < this.width * 0.5;
        let rgb = COLORS.stable;

        if (this.state === "capability-ledger") {
          rgb = COLORS.structure;
        } else if (this.state === "capability-scenario" && (i + j) % 5 === 0) {
          rgb = COLORS.tension;
        } else if (cfg.criticality > 0.7 && leftSide) {
          rgb = COLORS.risk;
        } else if (cfg.criticality > 0.45) {
          rgb = COLORS.tension;
        }

        const alpha = cfg.lineAlpha * t;
        this.ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        this.ctx.lineWidth = this.state === "capability-integration" ? 1 : 0.78;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNodes(cfg: StateConfig, time: number): void {
    const baseAlpha = this.state === "demo-standard" ? 0.18 : 0.26;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      const pulse = 0.5 + Math.sin(time * 0.0006 + n.seed * 1.6) * 0.18;
      const radius = this.reducedMotion ? 1.02 : 0.92 + pulse * 0.18;

      const rgb = cfg.criticality > 0.75 ? COLORS.risk : COLORS.stable;
      this.ctx.fillStyle = `rgba(${rgb}, ${(baseAlpha + pulse * 0.08).toFixed(3)})`;
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawRegime(cfg: StateConfig, inRuptureSilence: boolean): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    const voidRadius = Math.min(this.width, this.height) * cfg.voidRadius;
    const hole = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, voidRadius);
    hole.addColorStop(0, "rgba(3,6,11,0.32)");
    hole.addColorStop(1, "rgba(4,8,14,0)");
    this.ctx.fillStyle = hole;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, voidRadius, 0, Math.PI * 2);
    this.ctx.fill();

    if (cfg.criticality > 0.7) {
      const grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
      grad.addColorStop(0, "rgba(255,102,102,0.12)");
      grad.addColorStop(0.5, "rgba(255,102,102,0.02)");
      grad.addColorStop(1, "rgba(0,218,183,0.1)");
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.state === "binary-before" || this.state === "binary-after") {
      const split = this.ctx.createLinearGradient(0, 0, this.width, 0);
      split.addColorStop(0, "rgba(255,181,89,0.08)");
      split.addColorStop(0.5, "rgba(9,16,26,0)");
      split.addColorStop(1, "rgba(0,218,183,0.09)");
      this.ctx.fillStyle = split;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.state === "rupture") {
      const compression = this.ctx.createLinearGradient(0, 0, 0, this.height);
      compression.addColorStop(0, "rgba(255,255,255,0.03)");
      compression.addColorStop(0.5, "rgba(0,0,0,0)");
      compression.addColorStop(1, "rgba(255,255,255,0.03)");
      this.ctx.fillStyle = compression;
      this.ctx.fillRect(0, 0, this.width, this.height);
      if (inRuptureSilence) {
        this.ctx.fillStyle = "rgba(2,4,8,0.18)";
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
    }

    if (this.state === "demo-standard") {
      this.ctx.fillStyle = "rgba(1,3,7,0.22)";
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, Math.min(this.width, this.height) * 0.14, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private updateOverlay(): void {
    const phase = STATE_PHASE_BY_STATE[this.state] ?? "REORDENANDO";
    let html = `<span>ESTADO: ${phase}</span>`;

    if (this.state === "demo-standard") {
      const decisionId = this.readStorage("aurora_demo_session_id") ?? "pending";
      const decisionHash = this.readStorage("aurora_demo_fingerprint") ?? "pending";
      html += `<span>decision_id: ${decisionId}</span><span>decision_hash: ${decisionHash}</span>`;
    }

    this.overlay.innerHTML = html;
    this.overlay.classList.add("is-visible");
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export function mountDecisionField(root: HTMLElement): () => void {
  const globalScope = window as Window & {
    [RAF_KEY]?: DecisionFieldController;
  };

  const existing = globalScope[RAF_KEY];
  if (existing) {
    existing.destroy();
  }

  const controller = new DecisionFieldController(root);
  globalScope[RAF_KEY] = controller;

  return () => {
    controller.destroy();
    if (globalScope[RAF_KEY] === controller) {
      delete globalScope[RAF_KEY];
    }
  };
}
