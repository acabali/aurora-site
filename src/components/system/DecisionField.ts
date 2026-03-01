export type DecisionFieldState =
  | "hero"
  | "change"
  | "rupture"
  | "stabilized"
  | "binary"
  | "footprint";

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  seed: number;
  energy: number;
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
  splitChaos: number;
  anchorPull: number;
  freezePull: number;
};

const MIN_PARTICLES = 50;
const MAX_PARTICLES = 120;
const MOBILE_BREAKPOINT = 768;

const COLORS = {
  stable: "0,255,198",
  tension: "255,176,32",
  risk: "255,77,77",
  soft: "26,35,48",
};

const STATE_CONFIG: Record<DecisionFieldState, StateConfig> = {
  hero: {
    density: 0.92,
    jitter: 0.62,
    drag: 0.956,
    lineDistance: 138,
    lineAlpha: 0.22,
    instability: 0.44,
    cursorForce: 0.95,
    splitChaos: 0,
    anchorPull: 0.0006,
    freezePull: 0,
  },
  change: {
    density: 1.12,
    jitter: 0.46,
    drag: 0.963,
    lineDistance: 164,
    lineAlpha: 0.3,
    instability: 0.26,
    cursorForce: 1.04,
    splitChaos: 0,
    anchorPull: 0.0009,
    freezePull: 0,
  },
  rupture: {
    density: 1,
    jitter: 0.58,
    drag: 0.951,
    lineDistance: 146,
    lineAlpha: 0.28,
    instability: 0.37,
    cursorForce: 0.88,
    splitChaos: 0.9,
    anchorPull: 0.0015,
    freezePull: 0,
  },
  stabilized: {
    density: 0.8,
    jitter: 0.17,
    drag: 0.978,
    lineDistance: 156,
    lineAlpha: 0.25,
    instability: 0.08,
    cursorForce: 0.64,
    splitChaos: 0,
    anchorPull: 0.0021,
    freezePull: 0,
  },
  binary: {
    density: 0.86,
    jitter: 0.2,
    drag: 0.974,
    lineDistance: 148,
    lineAlpha: 0.23,
    instability: 0.12,
    cursorForce: 0.71,
    splitChaos: 0,
    anchorPull: 0.0017,
    freezePull: 0,
  },
  footprint: {
    density: 0.74,
    jitter: 0.04,
    drag: 0.986,
    lineDistance: 132,
    lineAlpha: 0.17,
    instability: 0.02,
    cursorForce: 0.42,
    splitChaos: 0,
    anchorPull: 0.0026,
    freezePull: 0.024,
  },
};

const RAF_KEY = "__auroraDecisionField";

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
    this.scrollVelocity = Math.min(42, Math.abs(delta));
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

  private readonly onButtonHover = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest("a,button,[role='button']") as HTMLElement | null;
    if (!actionEl) return;

    const now = performance.now();
    if (this.lastHoverTarget === actionEl && now - this.lastHoverPulseTs < 130) return;

    this.lastHoverTarget = actionEl;
    this.lastHoverPulseTs = now;

    const rect = actionEl.getBoundingClientRect();
    this.emitPulse(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 32);
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
    document.removeEventListener("pointerover", this.onButtonHover, true);
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
    document.addEventListener("pointerover", this.onButtonHover, { passive: true, capture: true });
    this.mediaQuery.addEventListener("change", this.onReduceMotionChange);
    this.mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
  }

  private readBodyState(): DecisionFieldState {
    const value = (document.body.dataset.state ?? "hero") as DecisionFieldState;
    if (value in STATE_CONFIG) return value;
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
    let target = Math.round(area / 10800);

    if (this.width < MOBILE_BREAKPOINT) {
      target = Math.round(target * 0.72);
    }

    target = Math.round(target * STATE_CONFIG[this.state].density);
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
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      ox: x,
      oy: y,
      seed: Math.random() * Math.PI * 2,
      energy: 0.65 + Math.random() * 0.35,
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
    if (this.pulses.length > 12) this.pulses.shift();
  }

  private frame = (time: number): void => {
    this.raf = window.requestAnimationFrame(this.frame);
    this.render(time);
  };

  private render(time: number): void {
    const cfg = STATE_CONFIG[this.state];

    this.ctx.clearRect(0, 0, this.width, this.height);

    const persistence = this.state === "footprint" ? 0.08 : 0.16;
    this.ctx.fillStyle = `rgba(${COLORS.soft}, ${persistence.toFixed(3)})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.updatePulses();
    this.updateNodes(time, cfg);
    this.drawConnections(cfg, time);
    this.drawNodes(time);
    this.drawStateAccents(cfg, time);

    if (this.state === "footprint" && time >= this.nextOverlaySync) {
      this.updateOverlay();
      this.nextOverlaySync = time + 600;
    }

    this.scrollVelocity = Math.max(0, this.scrollVelocity * 0.9);
  }

  private updatePulses(): void {
    for (let i = this.pulses.length - 1; i >= 0; i -= 1) {
      const pulse = this.pulses[i];
      pulse.radius += 10;
      pulse.life -= 0.028;
      if (pulse.life <= 0) {
        this.pulses.splice(i, 1);
      }
    }
  }

  private updateNodes(time: number, cfg: StateConfig): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const splitX = centerX;
    const leftPoleX = this.width * 0.32;
    const rightPoleX = this.width * 0.68;
    const poleY = centerY;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];

      const localNoise =
        Math.sin(time * 0.0012 + n.seed) * cfg.jitter * 0.18 +
        Math.cos(time * 0.0017 + n.seed * 1.3) * cfg.jitter * 0.12;

      n.vx += localNoise;
      n.vy += Math.sin(time * 0.001 + n.seed) * cfg.jitter * 0.16;

      if (this.cursor.active && !this.reducedMotion) {
        const dx = n.x - this.cursor.x;
        const dy = n.y - this.cursor.y;
        const distSq = dx * dx + dy * dy;
        const radius = 180 + this.scrollVelocity * 2;
        const radiusSq = radius * radius;

        if (distSq < radiusSq) {
          const dist = Math.sqrt(Math.max(0.001, distSq));
          const influence = (1 - dist / radius) * cfg.cursorForce;
          n.vx += (dx / dist) * influence;
          n.vy += (dy / dist) * influence;
        }
      }

      for (let p = 0; p < this.pulses.length; p += 1) {
        const pulse = this.pulses[p];
        const dx = n.x - pulse.x;
        const dy = n.y - pulse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const band = 42;
        const waveDelta = Math.abs(dist - pulse.radius);

        if (waveDelta < band) {
          const push = ((band - waveDelta) / band) * pulse.power * pulse.life * 0.012;
          const norm = dist > 0 ? 1 / dist : 0;
          n.vx += dx * norm * push;
          n.vy += dy * norm * push;
        }
      }

      if (this.state === "rupture") {
        if (n.x < splitX) {
          n.vx += (Math.random() - 0.5) * cfg.splitChaos;
          n.vy += (Math.random() - 0.5) * cfg.splitChaos;
        } else {
          n.vx += (n.ox - n.x) * cfg.anchorPull;
          n.vy += (n.oy - n.y) * cfg.anchorPull;
        }
      } else if (this.state === "stabilized") {
        n.vx += (centerX - n.x) * 0.0007;
        n.vy += (centerY - n.y) * 0.0007;
      } else if (this.state === "binary") {
        const towardsRight = n.x >= centerX;
        const poleX = towardsRight ? rightPoleX : leftPoleX;
        const strength = towardsRight ? 0.0018 : 0.0007;
        n.vx += (poleX - n.x) * strength;
        n.vy += (poleY - n.y) * strength;
      } else if (this.state === "footprint") {
        n.vx += (n.ox - n.x) * cfg.freezePull;
        n.vy += (n.oy - n.y) * cfg.freezePull;
        n.vx += (centerX - n.x) * 0.00028;
        n.vy += (centerY - n.y) * 0.00028;
      } else {
        n.vx += (n.ox - n.x) * cfg.anchorPull;
        n.vy += (n.oy - n.y) * cfg.anchorPull;
      }

      const scrollImpulse = (this.scrollRatio - 0.5) * 0.04;
      n.vx += scrollImpulse * n.energy;

      n.vx *= cfg.drag;
      n.vy *= cfg.drag;

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) {
        n.x = 0;
        n.vx *= -0.75;
      } else if (n.x > this.width) {
        n.x = this.width;
        n.vx *= -0.75;
      }

      if (n.y < 0) {
        n.y = 0;
        n.vy *= -0.75;
      } else if (n.y > this.height) {
        n.y = this.height;
        n.vy *= -0.75;
      }
    }
  }

  private drawConnections(cfg: StateConfig, time: number): void {
    const dynamicDistance = cfg.lineDistance * (0.92 + this.scrollRatio * 0.22);
    const maxDistSq = dynamicDistance * dynamicDistance;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > maxDistSq) continue;
        if (!this.reducedMotion && Math.random() < cfg.instability * 0.06) continue;

        const dist = Math.sqrt(distSq);
        const t = 1 - dist / dynamicDistance;

        let rgb = COLORS.stable;
        if (this.state === "hero") {
          rgb = Math.random() < 0.46 ? COLORS.tension : COLORS.soft;
        } else if (this.state === "change") {
          rgb = Math.random() < 0.26 ? COLORS.tension : COLORS.stable;
        } else if (this.state === "rupture") {
          rgb = a.x < this.width * 0.5 || b.x < this.width * 0.5 ? COLORS.risk : COLORS.stable;
        } else if (this.state === "binary") {
          const inDominant = a.x > this.width * 0.5 || b.x > this.width * 0.5;
          rgb = inDominant ? COLORS.stable : COLORS.tension;
        } else if (this.state === "footprint") {
          rgb = COLORS.soft;
        }

        const flicker = this.state === "hero" ? 0.72 + Math.sin(time * 0.004 + i + j) * 0.12 : 1;
        const alpha = cfg.lineAlpha * t * flicker;

        this.ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        this.ctx.lineWidth = this.state === "stabilized" ? 0.96 : 0.84;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNodes(time: number): void {
    const baseAlpha = this.state === "footprint" ? 0.32 : 0.44;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      const pulse = 0.5 + Math.sin(time * 0.0014 + n.seed * 3.1) * 0.5;
      const radius = this.state === "footprint" ? 1.15 : 1.4 + pulse * 0.55;

      this.ctx.fillStyle = `rgba(${COLORS.stable}, ${(baseAlpha + pulse * 0.18).toFixed(3)})`;
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (this.state === "hero") {
      this.ctx.fillStyle = "rgba(255,176,32,0.08)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private drawStateAccents(cfg: StateConfig, time: number): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    if (this.state === "stabilized") {
      const radius = 14 + Math.sin(time * 0.0035) * 4;
      const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120);
      gradient.addColorStop(0, "rgba(0,255,198,0.26)");
      gradient.addColorStop(1, "rgba(0,255,198,0)");
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = "rgba(0,255,198,0.56)";
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();
      return;
    }

    if (this.state === "binary") {
      this.drawPole(this.width * 0.33, centerY, 58, "rgba(255,176,32,0.10)", 0.26);
      this.drawPole(this.width * 0.69, centerY, 92, "rgba(0,255,198,0.22)", 0.58);
      return;
    }

    if (this.state === "rupture") {
      const grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
      grad.addColorStop(0, "rgba(255,77,77,0.08)");
      grad.addColorStop(0.48, "rgba(255,77,77,0.03)");
      grad.addColorStop(0.52, "rgba(0,255,198,0.03)");
      grad.addColorStop(1, "rgba(0,255,198,0.08)");
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }

    if (this.state === "footprint") {
      const radius = 96 + Math.sin(time * 0.0012) * 6;
      const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, "rgba(0,255,198,0.16)");
      gradient.addColorStop(1, "rgba(0,255,198,0)");
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();
      return;
    }

    if (this.state === "change") {
      this.drawPole(centerX, centerY, 78 + this.scrollVelocity * 0.3, "rgba(255,176,32,0.08)", 0.2);
      return;
    }

    if (cfg.jitter > 0.2) {
      const noiseAlpha = Math.min(0.045, cfg.jitter * 0.04);
      this.ctx.fillStyle = `rgba(${COLORS.soft}, ${noiseAlpha.toFixed(3)})`;
      for (let i = 0; i < 24; i += 1) {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        this.ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  private drawPole(x: number, y: number, radius: number, fill: string, nodeAlpha: number): void {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, fill);
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(${COLORS.stable}, ${nodeAlpha.toFixed(3)})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, Math.max(6, radius * 0.08), 0, Math.PI * 2);
    this.ctx.fill();
  }

  private updateOverlay(): void {
    if (this.state !== "footprint") {
      this.overlay.classList.remove("is-visible");
      return;
    }

    const decisionId = this.readStorage("aurora_demo_session_id") ?? "pending";
    const decisionHash = this.readStorage("aurora_demo_fingerprint") ?? "pending";

    this.overlay.innerHTML =
      `<span>decision_id: ${decisionId}</span>` +
      `<span>decision_hash: ${decisionHash}</span>`;
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
