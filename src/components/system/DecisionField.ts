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
  | "capability-operations"
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
  operations: "capability-operations",
};

const BASE_STATE_CONFIG: Record<DecisionFieldState, StateConfig> = {
  hero: {
    density: 0.72,
    jitter: 0.12,
    drag: 0.978,
    lineDistance: 138,
    lineAlpha: 0.17,
    instability: 0.04,
    cursorForce: 0.52,
    anchorPull: 0.0017,
    centerPull: 0.0004,
    splitBias: 0,
    voidRadius: 0.36,
    criticality: 0.22,
  },
  change: {
    density: 0.84,
    jitter: 0.16,
    drag: 0.972,
    lineDistance: 148,
    lineAlpha: 0.21,
    instability: 0.07,
    cursorForce: 0.6,
    anchorPull: 0.0014,
    centerPull: 0.00072,
    splitBias: 0,
    voidRadius: 0.29,
    criticality: 0.35,
  },
  rupture: {
    density: 1.06,
    jitter: 0.34,
    drag: 0.952,
    lineDistance: 154,
    lineAlpha: 0.3,
    instability: 0.16,
    cursorForce: 0.74,
    anchorPull: 0.0008,
    centerPull: 0.00032,
    splitBias: 0.92,
    voidRadius: 0.14,
    criticality: 0.88,
  },
  stabilized: {
    density: 0.58,
    jitter: 0.06,
    drag: 0.986,
    lineDistance: 130,
    lineAlpha: 0.15,
    instability: 0.02,
    cursorForce: 0.42,
    anchorPull: 0.0028,
    centerPull: 0.0012,
    splitBias: 0,
    voidRadius: 0.42,
    criticality: 0.12,
  },
  "capability-core": {
    density: 0.7,
    jitter: 0.08,
    drag: 0.982,
    lineDistance: 134,
    lineAlpha: 0.17,
    instability: 0.03,
    cursorForce: 0.44,
    anchorPull: 0.0022,
    centerPull: 0.001,
    splitBias: 0,
    voidRadius: 0.34,
    criticality: 0.2,
  },
  "capability-scenario": {
    density: 0.82,
    jitter: 0.15,
    drag: 0.974,
    lineDistance: 142,
    lineAlpha: 0.2,
    instability: 0.06,
    cursorForce: 0.57,
    anchorPull: 0.0016,
    centerPull: 0.0009,
    splitBias: 0,
    voidRadius: 0.28,
    criticality: 0.38,
  },
  "capability-risk": {
    density: 1.16,
    jitter: 0.38,
    drag: 0.946,
    lineDistance: 160,
    lineAlpha: 0.33,
    instability: 0.2,
    cursorForce: 0.84,
    anchorPull: 0.00072,
    centerPull: 0.00016,
    splitBias: 0.88,
    voidRadius: 0.1,
    criticality: 1,
  },
  "capability-signal": {
    density: 0.92,
    jitter: 0.2,
    drag: 0.966,
    lineDistance: 146,
    lineAlpha: 0.25,
    instability: 0.1,
    cursorForce: 0.62,
    anchorPull: 0.0011,
    centerPull: 0.00066,
    splitBias: 0,
    voidRadius: 0.22,
    criticality: 0.56,
  },
  "capability-ledger": {
    density: 0.66,
    jitter: 0.06,
    drag: 0.987,
    lineDistance: 128,
    lineAlpha: 0.16,
    instability: 0.02,
    cursorForce: 0.4,
    anchorPull: 0.0027,
    centerPull: 0.0012,
    splitBias: 0,
    voidRadius: 0.38,
    criticality: 0.14,
  },
  "capability-growth": {
    density: 0.9,
    jitter: 0.17,
    drag: 0.971,
    lineDistance: 150,
    lineAlpha: 0.23,
    instability: 0.08,
    cursorForce: 0.58,
    anchorPull: 0.0013,
    centerPull: 0.00084,
    splitBias: 0,
    voidRadius: 0.25,
    criticality: 0.46,
  },
  "capability-cost": {
    density: 1.02,
    jitter: 0.27,
    drag: 0.958,
    lineDistance: 152,
    lineAlpha: 0.29,
    instability: 0.14,
    cursorForce: 0.7,
    anchorPull: 0.0009,
    centerPull: 0.00042,
    splitBias: 0.52,
    voidRadius: 0.17,
    criticality: 0.74,
  },
  "capability-cash": {
    density: 1.12,
    jitter: 0.32,
    drag: 0.952,
    lineDistance: 156,
    lineAlpha: 0.32,
    instability: 0.17,
    cursorForce: 0.78,
    anchorPull: 0.00076,
    centerPull: 0.00026,
    splitBias: 0.74,
    voidRadius: 0.13,
    criticality: 0.92,
  },
  "capability-pricing": {
    density: 0.94,
    jitter: 0.22,
    drag: 0.964,
    lineDistance: 149,
    lineAlpha: 0.26,
    instability: 0.11,
    cursorForce: 0.63,
    anchorPull: 0.001,
    centerPull: 0.00056,
    splitBias: 0.34,
    voidRadius: 0.21,
    criticality: 0.61,
  },
  "capability-expansion": {
    density: 0.86,
    jitter: 0.14,
    drag: 0.973,
    lineDistance: 145,
    lineAlpha: 0.22,
    instability: 0.08,
    cursorForce: 0.56,
    anchorPull: 0.0013,
    centerPull: 0.00076,
    splitBias: 0.14,
    voidRadius: 0.27,
    criticality: 0.42,
  },
  "capability-integration": {
    density: 0.8,
    jitter: 0.1,
    drag: 0.979,
    lineDistance: 140,
    lineAlpha: 0.2,
    instability: 0.06,
    cursorForce: 0.51,
    anchorPull: 0.0018,
    centerPull: 0.00094,
    splitBias: 0,
    voidRadius: 0.31,
    criticality: 0.3,
  },
  "capability-operations": {
    density: 0.94,
    jitter: 0.18,
    drag: 0.968,
    lineDistance: 148,
    lineAlpha: 0.26,
    instability: 0.12,
    cursorForce: 0.66,
    anchorPull: 0.0012,
    centerPull: 0.00062,
    splitBias: 0.22,
    voidRadius: 0.22,
    criticality: 0.58,
  },
  "binary-before": {
    density: 0.98,
    jitter: 0.24,
    drag: 0.962,
    lineDistance: 150,
    lineAlpha: 0.27,
    instability: 0.12,
    cursorForce: 0.64,
    anchorPull: 0.001,
    centerPull: 0.0005,
    splitBias: 0.46,
    voidRadius: 0.18,
    criticality: 0.66,
  },
  "binary-after": {
    density: 0.62,
    jitter: 0.05,
    drag: 0.988,
    lineDistance: 132,
    lineAlpha: 0.15,
    instability: 0.02,
    cursorForce: 0.39,
    anchorPull: 0.0029,
    centerPull: 0.00135,
    splitBias: 0,
    voidRadius: 0.45,
    criticality: 0.1,
  },
  "demo-standard": {
    density: 0.52,
    jitter: 0.03,
    drag: 0.989,
    lineDistance: 126,
    lineAlpha: 0.13,
    instability: 0.01,
    cursorForce: 0.34,
    anchorPull: 0.003,
    centerPull: 0.00142,
    splitBias: 0,
    voidRadius: 0.5,
    criticality: 0.05,
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
    this.emitPulse(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 28);
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
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
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

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = `rgba(${COLORS.structure}, ${this.state === "demo-standard" ? "0.12" : "0.2"})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.updatePulses();
    this.updateNodes(time, cfg);
    this.drawConnections(cfg, time);
    this.drawNodes(cfg, time);
    this.drawRegime(cfg, time);

    if (this.state === "demo-standard" && time >= this.nextOverlaySync) {
      this.updateOverlay();
      this.nextOverlaySync = time + 700;
    }

    this.scrollVelocity = Math.max(0, this.scrollVelocity * 0.88);
  }

  private updatePulses(): void {
    for (let i = this.pulses.length - 1; i >= 0; i -= 1) {
      const pulse = this.pulses[i];
      pulse.radius += 9;
      pulse.life -= 0.03;
      if (pulse.life <= 0) {
        this.pulses.splice(i, 1);
      }
    }
  }

  private updateNodes(time: number, cfg: StateConfig): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const splitX = centerX;
    const rightPole = this.width * 0.68;
    const leftPole = this.width * 0.32;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];

      const localNoise =
        Math.sin(time * 0.0009 + n.seed) * cfg.jitter * 0.16 +
        Math.cos(time * 0.0011 + n.seed * 1.2) * cfg.jitter * 0.1;

      n.vx += localNoise;
      n.vy += Math.sin(time * 0.001 + n.seed) * cfg.jitter * 0.12;

      if (this.cursor.active && !this.reducedMotion) {
        const dx = n.x - this.cursor.x;
        const dy = n.y - this.cursor.y;
        const distSq = dx * dx + dy * dy;
        const radius = 180 + this.scrollVelocity * 2;
        const radiusSq = radius * radius;

        if (distSq < radiusSq) {
          const dist = Math.sqrt(Math.max(0.001, distSq));
          const influence = (1 - dist / radius) * cfg.cursorForce * n.mass;
          n.vx += (dx / dist) * influence;
          n.vy += (dy / dist) * influence;
        }
      }

      for (let p = 0; p < this.pulses.length; p += 1) {
        const pulse = this.pulses[p];
        const dx = n.x - pulse.x;
        const dy = n.y - pulse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const band = 36;
        const waveDelta = Math.abs(dist - pulse.radius);

        if (waveDelta < band) {
          const push = ((band - waveDelta) / band) * pulse.power * pulse.life * 0.01;
          const norm = dist > 0 ? 1 / dist : 0;
          n.vx += dx * norm * push;
          n.vy += dy * norm * push;
        }
      }

      if (cfg.splitBias > 0) {
        const onLeft = n.x < splitX;
        const chaos = cfg.splitBias * 0.07;
        n.vx += (Math.random() - 0.5) * chaos;
        n.vy += (Math.random() - 0.5) * chaos;

        if (this.state === "binary-after") {
          const poleX = onLeft ? leftPole : rightPole;
          n.vx += (poleX - n.x) * 0.0011;
          n.vy += (centerY - n.y) * 0.0011;
        }
      }

      if (this.state === "binary-before") {
        const poleX = n.x > centerX ? rightPole : leftPole;
        n.vx += (poleX - n.x) * 0.00058;
        n.vy += (centerY - n.y) * 0.0005;
      }

      n.vx += (n.ox - n.x) * cfg.anchorPull;
      n.vy += (n.oy - n.y) * cfg.anchorPull;
      n.vx += (centerX - n.x) * cfg.centerPull;
      n.vy += (centerY - n.y) * cfg.centerPull;

      const scrollImpulse = (this.scrollRatio - 0.5) * 0.036;
      n.vx += scrollImpulse * n.mass;

      n.vx *= cfg.drag;
      n.vy *= cfg.drag;

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) {
        n.x = 0;
        n.vx *= -0.72;
      } else if (n.x > this.width) {
        n.x = this.width;
        n.vx *= -0.72;
      }

      if (n.y < 0) {
        n.y = 0;
        n.vy *= -0.72;
      } else if (n.y > this.height) {
        n.y = this.height;
        n.vy *= -0.72;
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
        if (!this.reducedMotion && Math.random() < cfg.instability * 0.05) continue;

        const dist = Math.sqrt(distSq);
        const t = 1 - dist / dynamicDistance;
        const flicker = 0.92 + Math.sin(time * 0.002 + i + j) * 0.08;

        const leftSide = a.x < this.width * 0.5 || b.x < this.width * 0.5;
        let rgb = COLORS.stable;

        if (cfg.criticality > 0.7 && leftSide) {
          rgb = COLORS.risk;
        } else if (cfg.criticality > 0.45) {
          rgb = COLORS.tension;
        }

        const alpha = cfg.lineAlpha * t * flicker;
        this.ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        this.ctx.lineWidth = cfg.criticality > 0.7 ? 1.05 : 0.84;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNodes(cfg: StateConfig, time: number): void {
    const baseAlpha = this.state === "demo-standard" ? 0.24 : 0.34;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      const pulse = 0.5 + Math.sin(time * 0.0012 + n.seed * 2.7) * 0.5;
      const radius = this.reducedMotion ? 1.1 : 1.06 + pulse * 0.4;

      const rgb = cfg.criticality > 0.75 ? COLORS.risk : COLORS.stable;
      this.ctx.fillStyle = `rgba(${rgb}, ${(baseAlpha + pulse * 0.14).toFixed(3)})`;
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawRegime(cfg: StateConfig, time: number): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    const voidRadius = Math.min(this.width, this.height) * cfg.voidRadius;
    const hole = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, voidRadius);
    hole.addColorStop(0, "rgba(4,8,14,0.28)");
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
      split.addColorStop(0, "rgba(255,181,89,0.1)");
      split.addColorStop(0.45, "rgba(255,181,89,0.02)");
      split.addColorStop(0.55, "rgba(0,218,183,0.02)");
      split.addColorStop(1, "rgba(0,218,183,0.12)");
      this.ctx.fillStyle = split;
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.strokeStyle = "rgba(132,149,177,0.16)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, 0);
      this.ctx.lineTo(centerX, this.height);
      this.ctx.stroke();
    }

    if (this.state === "demo-standard") {
      const pulseRadius = 92 + Math.sin(time * 0.0014) * 4;
      const halo = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
      halo.addColorStop(0, "rgba(255,255,255,0.11)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      this.ctx.fillStyle = halo;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private updateOverlay(): void {
    if (this.state !== "demo-standard") {
      this.overlay.classList.remove("is-visible");
      return;
    }

    const decisionId = this.readStorage("aurora_demo_session_id") ?? "pending";
    const decisionHash = this.readStorage("aurora_demo_fingerprint") ?? "pending";

    this.overlay.innerHTML =
      `<span>decision_id: ${decisionId}</span>` + `<span>decision_hash: ${decisionHash}</span>`;
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
