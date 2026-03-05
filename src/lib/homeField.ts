type SectionId = "hero" | "system" | "misfit" | "engine" | "what" | "demo";
type BootPhase = "point" | "line" | "network" | "ready";

type FieldState = {
  nodeCount: number;
  linkRadius: number;
  waveAmp: number;
  waveSpeed: number;
  rewire: number;
  converge: number;
  spine: number;
  accent: string;
};

type FieldNodeSeed = {
  x: number;
  y: number;
  z: number;
};

type PositionedNode = {
  x: number;
  y: number;
};

const SECTION_IDS: SectionId[] = ["hero", "system", "misfit", "engine", "what", "demo"];

const FIELD_STATES: Record<SectionId, FieldState> = {
  hero: {
    nodeCount: 8,
    linkRadius: 0.17,
    waveAmp: 2.4,
    waveSpeed: 0.32,
    rewire: 0.04,
    converge: 0.08,
    spine: 0.24,
    accent: "#2E5BFF",
  },
  system: {
    nodeCount: 12,
    linkRadius: 0.2,
    waveAmp: 3.2,
    waveSpeed: 0.42,
    rewire: 0.1,
    converge: 0.15,
    spine: 0.38,
    accent: "#2E5BFF",
  },
  misfit: {
    nodeCount: 18,
    linkRadius: 0.25,
    waveAmp: 4.6,
    waveSpeed: 0.58,
    rewire: 0.22,
    converge: 0.22,
    spine: 0.52,
    accent: "#00C389",
  },
  engine: {
    nodeCount: 22,
    linkRadius: 0.24,
    waveAmp: 5.4,
    waveSpeed: 0.68,
    rewire: 0.66,
    converge: 0.32,
    spine: 0.65,
    accent: "#7C5CFF",
  },
  what: {
    nodeCount: 24,
    linkRadius: 0.27,
    waveAmp: 4.2,
    waveSpeed: 0.52,
    rewire: 0.16,
    converge: 0.2,
    spine: 0.96,
    accent: "#00C389",
  },
  demo: {
    nodeCount: 14,
    linkRadius: 0.18,
    waveAmp: 2.2,
    waveSpeed: 0.36,
    rewire: 0.08,
    converge: 0.78,
    spine: 0.75,
    accent: "#2E5BFF",
  },
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const seeded = (value: number, salt: number): number => {
  const raw = Math.sin(value * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
};

const isSectionId = (value: string): value is SectionId => SECTION_IDS.includes(value as SectionId);

class AuroraFieldEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion: boolean;

  private readonly seeds: FieldNodeSeed[] = Array.from({ length: 30 }, (_, index) => ({
    x: 0.08 + seeded(index, 0.23) * 0.84,
    y: 0.14 + seeded(index, 0.61) * 0.72,
    z: seeded(index, 0.91),
  }));

  private activeSection: SectionId = "hero";
  private bootPhase: BootPhase = "point";
  private bootPhaseStart = 0;

  private width = 1;
  private height = 1;
  private dpr = 1;

  private pointerX = 0.5;
  private pointerY = 0.5;
  private pointerTargetX = 0.5;
  private pointerTargetY = 0.5;
  private pointerActive = false;

  private scrollProgress = 0;
  private wavePhase = 0;
  private rewirePhase = 0;

  private running = false;
  private raf = 0;
  private lastTick = 0;

  private currentNodeCount = FIELD_STATES.hero.nodeCount;
  private currentLinkRadius = FIELD_STATES.hero.linkRadius;
  private currentWaveAmp = FIELD_STATES.hero.waveAmp;
  private currentWaveSpeed = FIELD_STATES.hero.waveSpeed;
  private currentRewire = FIELD_STATES.hero.rewire;
  private currentConverge = FIELD_STATES.hero.converge;
  private currentSpine = FIELD_STATES.hero.spine;

  private readonly onResize = (): void => {
    this.syncSize();
  };

  constructor(canvas: HTMLCanvasElement, reducedMotion: boolean) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("AuroraField: canvas 2D context unavailable");
    }

    this.canvas = canvas;
    this.ctx = context;
    this.reducedMotion = reducedMotion;

    this.syncSize();
    window.addEventListener("resize", this.onResize);
  }

  setActiveSection(section: SectionId): void {
    this.activeSection = section;
  }

  setBootPhase(phase: BootPhase): void {
    this.bootPhase = phase;
    this.bootPhaseStart = performance.now();
    if (phase === "ready" && this.reducedMotion) {
      this.lastTick = 0;
    }
  }

  setPointer(clientX: number, clientY: number, active: boolean): void {
    this.pointerTargetX = clamp(clientX / Math.max(1, this.width), 0, 1);
    this.pointerTargetY = clamp(clientY / Math.max(1, this.height), 0, 1);
    this.pointerActive = active;
  }

  setScrollProgress(progress: number): void {
    this.scrollProgress = clamp(progress, 0, 1);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.raf = window.requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.running) return;

    const dt = this.lastTick > 0 ? clamp(timestamp - this.lastTick, 4, 40) : 16;
    this.lastTick = timestamp;

    this.update(dt);
    this.render(timestamp);

    this.raf = window.requestAnimationFrame(this.tick);
  };

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

  private update(dt: number): void {
    const target = FIELD_STATES[this.activeSection];

    this.currentNodeCount = lerp(this.currentNodeCount, target.nodeCount, 0.12);
    this.currentLinkRadius = lerp(this.currentLinkRadius, target.linkRadius, 0.1);
    this.currentWaveAmp = lerp(this.currentWaveAmp, target.waveAmp, 0.1);
    this.currentWaveSpeed = lerp(this.currentWaveSpeed, target.waveSpeed, 0.08);
    this.currentRewire = lerp(this.currentRewire, target.rewire, 0.1);
    this.currentConverge = lerp(this.currentConverge, target.converge, 0.08);
    this.currentSpine = lerp(this.currentSpine, target.spine, 0.08);

    const pointerBlend = this.pointerActive ? 0.18 : 0.06;
    this.pointerX = lerp(this.pointerX, this.pointerTargetX, pointerBlend);
    this.pointerY = lerp(this.pointerY, this.pointerTargetY, pointerBlend);

    this.wavePhase += dt * (0.0004 + this.currentWaveSpeed * 0.00055);
    this.rewirePhase += dt * (0.00028 + this.currentRewire * 0.0004);
  }

  private resolveBootNetworkFactor(now: number): number {
    if (this.bootPhase === "point") return 0;
    if (this.bootPhase === "line") return 0.08;
    if (this.bootPhase === "ready") return 1;

    const elapsed = now - this.bootPhaseStart;
    return clamp(elapsed / 280, 0, 1);
  }

  private resolveNodes(visibleNodes: number): PositionedNode[] {
    const result: PositionedNode[] = [];
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const cursorX = this.pointerX * this.width;
    const cursorY = this.pointerY * this.height;

    for (let index = 0; index < visibleNodes; index += 1) {
      const seed = this.seeds[index];

      let x = seed.x * this.width;
      let y = seed.y * this.height;

      const sway = Math.sin(this.wavePhase * 5 + seed.z * 9 + this.scrollProgress * 4.4);
      y += sway * this.currentWaveAmp * 2.2;

      const rx = x - centerX;
      const ry = y - centerY;
      const angle = this.currentRewire * 0.42 * Math.sin(this.rewirePhase * 3 + index * 0.43);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      x = centerX + rx * cos - ry * sin;
      y = centerY + rx * sin + ry * cos;

      x = lerp(x, centerX, this.currentConverge);
      y = lerp(y, centerY, this.currentConverge);

      const dx = x - cursorX;
      const dy = y - cursorY;
      const distance = Math.hypot(dx, dy);
      const radius = Math.min(this.width, this.height) * 0.22;

      if (distance < radius) {
        const ratio = 1 - distance / radius;
        const force = ratio * ratio * (this.pointerActive ? 26 : 10);
        const direction = this.activeSection === "demo" ? -1 : 1;
        const ux = distance > 0 ? dx / distance : 0;
        const uy = distance > 0 ? dy / distance : 0;
        x += ux * force * 0.34 * direction;
        y += uy * force * 0.34 * direction;
      }

      result.push({ x: clamp(x, 0, this.width), y: clamp(y, 0, this.height) });
    }

    return result;
  }

  private drawBootPoint(accent: string): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = accent;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 2.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private drawBootLine(accent: string): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    this.ctx.strokeStyle = accent;
    this.ctx.globalAlpha = 0.45;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - Math.min(220, this.width * 0.22), centerY);
    this.ctx.lineTo(centerX + Math.min(96, this.width * 0.1), centerY);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private drawSpine(accent: string): void {
    const x = clamp(this.width * 0.068, 28, 86);

    this.ctx.strokeStyle = "rgba(191,194,199,0.28)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, this.height * 0.08);
    this.ctx.lineTo(x, this.height * 0.92);
    this.ctx.stroke();

    const sectionIndex = SECTION_IDS.indexOf(this.activeSection);
    const segment = this.height * 0.84 / SECTION_IDS.length;
    const top = this.height * 0.08 + sectionIndex * segment;

    this.ctx.strokeStyle = accent;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = clamp(0.28 + this.currentSpine * 0.6, 0.2, 0.92);
    this.ctx.beginPath();
    this.ctx.moveTo(x, top + segment * 0.18);
    this.ctx.lineTo(x, top + segment * 0.82);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private drawWaves(accent: string): void {
    const lines = 2;

    for (let index = 0; index < lines; index += 1) {
      const baseY = this.height * (0.3 + index * 0.3);
      const amp = this.currentWaveAmp * (1 + index * 0.22);
      const freq = 0.007 + index * 0.0018;

      this.ctx.strokeStyle = index === 0 ? "rgba(191,194,199,0.16)" : accent;
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = index === 0 ? 0.5 : 0.24;
      this.ctx.beginPath();

      for (let x = 0; x <= this.width; x += 10) {
        const phase = this.wavePhase * (4 + index) + this.scrollProgress * 4.8;
        const y = baseY + Math.sin(x * freq + phase) * amp;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }

      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawConnections(points: PositionedNode[], accent: string, intensity: number): void {
    const radius = Math.min(this.width, this.height) * this.currentLinkRadius;
    const radiusSq = radius * radius;
    const hub = Math.floor(points.length * 0.5);

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > radiusSq) continue;

        const dist = Math.sqrt(distSq);
        const ratio = 1 - dist / radius;
        const dominant = i === hub || j === hub;

        this.ctx.strokeStyle = dominant ? accent : "rgba(191,194,199,0.4)";
        this.ctx.globalAlpha = ratio * (dominant ? 0.24 : 0.1) * intensity;
        this.ctx.lineWidth = dominant ? 1.15 : 0.85;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawNodes(points: PositionedNode[], accent: string, intensity: number): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    for (const point of points) {
      const distance = Math.hypot(point.x - centerX, point.y - centerY);
      const centerRatio = 1 - clamp(distance / Math.min(this.width, this.height), 0, 1);
      const radius = 1.3 + centerRatio * 1.1;

      this.ctx.fillStyle = centerRatio > 0.62 ? accent : "rgba(247,247,245,0.78)";
      this.ctx.globalAlpha = (0.45 + centerRatio * 0.4) * intensity;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  private render(now: number): void {
    const state = FIELD_STATES[this.activeSection];
    const accent = state.accent;

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.bootPhase === "point") {
      this.drawBootPoint(accent);
      return;
    }

    if (this.bootPhase === "line") {
      this.drawBootPoint(accent);
      this.drawBootLine(accent);
      return;
    }

    const revealFactor = this.resolveBootNetworkFactor(now);
    const rawCount = Math.round(this.currentNodeCount * revealFactor);
    const visibleNodes = clamp(rawCount, 2, this.seeds.length);
    const nodes = this.resolveNodes(visibleNodes);

    this.drawSpine(accent);
    this.drawWaves(accent);
    this.drawConnections(nodes, accent, clamp(0.55 + revealFactor * 0.45, 0, 1));
    this.drawNodes(nodes, accent, clamp(0.5 + revealFactor * 0.5, 0, 1));
  }
}

export function initHomeSystem(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const body = document.body;
  const canvas = document.querySelector<HTMLCanvasElement>("[data-aurora-canvas]");
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-home-section]"));
  const railNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-rail-node]"));
  const hero = document.getElementById("hero");

  if (!canvas || sections.length === 0) {
    return () => {};
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const field = new AuroraFieldEngine(canvas, reducedMotion);

  let activeSection: SectionId = "hero";
  let alive = true;
  const bootTimers: number[] = [];
  const ratios = new Map<SectionId, number>();

  const setActiveSection = (section: SectionId): void => {
    activeSection = section;
    body.dataset.activeSection = section;
    field.setActiveSection(section);

    for (const railNode of railNodes) {
      railNode.dataset.active = railNode.dataset.section === section ? "true" : "false";
    }
  };

  const setBootPhase = (phase: BootPhase): void => {
    body.dataset.bootPhase = phase;
    field.setBootPhase(phase);
  };

  const syncScrollProgress = (): void => {
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    field.setScrollProgress(window.scrollY / maxScroll);
  };

  const onPointerMove = (event: PointerEvent): void => {
    field.setPointer(event.clientX, event.clientY, true);
  };

  const onPointerLeave = (): void => {
    field.setPointer(window.innerWidth * 0.5, window.innerHeight * 0.5, false);
  };

  const onVisibilityChange = (): void => {
    if (document.hidden) {
      field.stop();
      return;
    }

    field.start();
  };

  const resolveDominantSection = (): SectionId => {
    let bestSection = activeSection;
    let bestRatio = -1;

    for (const section of SECTION_IDS) {
      const ratio = ratios.get(section) ?? 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestSection = section;
      }
    }

    return bestSection;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (!isSectionId(id)) continue;

        ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);

        if (entry.isIntersecting && (id !== "hero" || body.dataset.bootState === "ready")) {
          entry.target.classList.add("revealed");
        }
      }

      const dominant = resolveDominantSection();
      setActiveSection(dominant);
    },
    {
      threshold: [0.15, 0.32, 0.55, 0.78],
      rootMargin: "-12% 0px -20% 0px",
    }
  );

  for (const section of sections) {
    section.classList.remove("revealed");
    if (isSectionId(section.id)) {
      ratios.set(section.id, 0);
    }
    observer.observe(section);
  }

  setActiveSection("hero");
  syncScrollProgress();

  window.addEventListener("scroll", syncScrollProgress, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibilityChange);

  body.dataset.bootState = "booting";

  if (reducedMotion) {
    body.dataset.bootState = "ready";
    setBootPhase("ready");
    for (const section of sections) {
      section.classList.add("revealed");
    }
  } else {
    setBootPhase("point");
    hero?.classList.remove("revealed");

    const schedule: Array<{ phase: BootPhase; at: number }> = [
      { phase: "line", at: 220 },
      { phase: "network", at: 520 },
      { phase: "ready", at: 840 },
    ];

    for (const item of schedule) {
      const timer = window.setTimeout(() => {
        if (!alive) return;
        setBootPhase(item.phase);

        if (item.phase === "ready") {
          body.dataset.bootState = "ready";
          hero?.classList.add("revealed");
        }
      }, item.at);

      bootTimers.push(timer);
    }
  }

  field.start();

  return () => {
    alive = false;

    observer.disconnect();
    for (const timer of bootTimers) {
      window.clearTimeout(timer);
    }

    window.removeEventListener("scroll", syncScrollProgress);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    delete body.dataset.activeSection;
    delete body.dataset.bootPhase;
    delete body.dataset.bootState;

    field.destroy();
  };
}
