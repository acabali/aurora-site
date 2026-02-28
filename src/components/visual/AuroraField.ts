type AuroraFieldMode = "hero" | "dense";

type AuroraFieldConfig = {
  nodes: number;
  maxLinksPerNode: number;
  linkDistance: number;
  lineAlpha: number;
  speed: number;
};

type InitOptions = { mode?: AuroraFieldMode };

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const MODE_CONFIG: Record<AuroraFieldMode, AuroraFieldConfig> = {
  hero: {
    nodes: 30,
    maxLinksPerNode: 2,
    linkDistance: 96,
    lineAlpha: 0.2,
    speed: 0.22,
  },
  dense: {
    nodes: 44,
    maxLinksPerNode: 4,
    linkDistance: 132,
    lineAlpha: 0.34,
    speed: 0.26,
  },
};

export class AuroraFieldController {
  private readonly containerEl: HTMLElement;
  private readonly canvasEl: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly nodes: NodePoint[] = [];
  private readonly maxNodeCapacity = MODE_CONFIG.dense.nodes;

  private mode: AuroraFieldMode;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private reducedMotion = false;
  private rafId = 0;
  private resizeObserver?: ResizeObserver;
  private introStart = 0;
  private lastFrameTs = 0;
  private frameBudgetMs = 1000 / 60;

  constructor(containerEl: HTMLElement, options?: InitOptions) {
    const ctx = document.createElement("canvas").getContext("2d", { alpha: true });
    if (!ctx) throw new Error("AuroraField: Canvas 2D context unavailable.");

    this.containerEl = containerEl;
    this.mode = options?.mode ?? "hero";
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.frameBudgetMs = navigator.hardwareConcurrency <= 4 ? 1000 / 30 : 1000 / 60;
    this.ctx = ctx;

    this.canvasEl = this.ctx.canvas;
    this.canvasEl.className = "aurora-field-canvas";
    this.canvasEl.setAttribute("aria-hidden", "true");
    this.canvasEl.setAttribute("role", "presentation");
    this.containerEl.appendChild(this.canvasEl);

    this.seedNodes();
    this.mountResizeObserver();
    this.resize();
    this.introStart = performance.now();

    if (this.reducedMotion) {
      this.renderFrame(1);
    } else {
      this.startLoop();
    }
  }

  setMode(nextMode: AuroraFieldMode): void {
    if (this.mode === nextMode) return;
    this.mode = nextMode;
    this.introStart = performance.now();
    this.reseedVelocity();
    if (this.reducedMotion) this.renderFrame(1);
  }

  destroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.canvasEl.parentElement === this.containerEl) {
      this.containerEl.removeChild(this.canvasEl);
    }
  }

  private mountResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.containerEl);
  }

  private seedNodes(): void {
    this.nodes.length = 0;
    for (let i = 0; i < this.maxNodeCapacity; i += 1) {
      this.nodes.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
    }
  }

  private reseedVelocity(): void {
    const speed = MODE_CONFIG[this.mode].speed;
    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      const direction = Math.random() * Math.PI * 2;
      n.vx = Math.cos(direction) * speed;
      n.vy = Math.sin(direction) * speed;
    }
  }

  private resize(): void {
    const rect = this.containerEl.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvasEl.width = Math.floor(this.width * this.dpr);
    this.canvasEl.height = Math.floor(this.height * this.dpr);
    this.canvasEl.style.width = `${this.width}px`;
    this.canvasEl.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const cfg = MODE_CONFIG[this.mode];
    for (let i = 0; i < this.nodes.length; i += 1) {
      const n = this.nodes[i];
      if (n.x === 0 && n.y === 0) {
        n.x = Math.random() * this.width;
        n.y = Math.random() * this.height;
      } else {
        n.x = Math.min(Math.max(n.x, 0), this.width);
        n.y = Math.min(Math.max(n.y, 0), this.height);
      }
      if (n.vx === 0 && n.vy === 0) {
        const angle = Math.random() * Math.PI * 2;
        n.vx = Math.cos(angle) * cfg.speed;
        n.vy = Math.sin(angle) * cfg.speed;
      }
    }
    if (this.reducedMotion) this.renderFrame(1);
  }

  private startLoop(): void {
    const tick = (ts: number) => {
      if (!this.lastFrameTs || ts - this.lastFrameTs >= this.frameBudgetMs) {
        this.lastFrameTs = ts;
        const introProgress = Math.min(1, (ts - this.introStart) / 1200);
        this.updateNodes();
        this.renderFrame(introProgress);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private getActiveNodeCount(progress: number): number {
    const modeNodes = MODE_CONFIG[this.mode].nodes;
    const startFactor = 0.46;
    return Math.max(8, Math.floor(modeNodes * (startFactor + (1 - startFactor) * progress)));
  }

  private updateNodes(): void {
    const cfg = MODE_CONFIG[this.mode];
    const activeCount = this.getActiveNodeCount(1);
    for (let i = 0; i < activeCount; i += 1) {
      const n = this.nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x <= 0 || n.x >= this.width) n.vx *= -1;
      if (n.y <= 0 || n.y >= this.height) n.vy *= -1;
      n.x = Math.min(Math.max(n.x, 0), this.width);
      n.y = Math.min(Math.max(n.y, 0), this.height);

      // Gentle friction keeps movement stable and avoids drift spikes.
      n.vx = Math.sign(n.vx) * Math.min(Math.abs(n.vx), cfg.speed);
      n.vy = Math.sign(n.vy) * Math.min(Math.abs(n.vy), cfg.speed);
    }
  }

  private renderFrame(progress: number): void {
    const cfg = MODE_CONFIG[this.mode];
    const activeCount = this.reducedMotion ? cfg.nodes : this.getActiveNodeCount(progress);
    const linkDistanceSq = cfg.linkDistance * cfg.linkDistance;
    const baseAlpha = cfg.lineAlpha * (this.reducedMotion ? 1 : Math.max(0.42, progress));
    const nodeAlpha = 0.44 * (this.reducedMotion ? 1 : Math.max(0.5, progress));

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = "rgba(11, 11, 12, 0.01)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    const lineColorBlue = "37, 99, 235";
    const lineColorGreen = "34, 197, 94";

    for (let i = 0; i < activeCount; i += 1) {
      const a = this.nodes[i];
      let links = 0;
      for (let j = i + 1; j < activeCount; j += 1) {
        if (links >= cfg.maxLinksPerNode) break;
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > linkDistanceSq) continue;

        const distRatio = 1 - Math.sqrt(distSq) / cfg.linkDistance;
        const alpha = baseAlpha * distRatio;
        const useGreen = this.mode === "dense" && (i + j) % 7 === 0;
        const rgb = useGreen ? lineColorGreen : lineColorBlue;
        this.ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        this.ctx.lineWidth = useGreen ? 1.1 : 0.9;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
        links += 1;
      }
    }

    this.ctx.fillStyle = `rgba(242, 242, 239, ${nodeAlpha.toFixed(3)})`;
    for (let i = 0; i < activeCount; i += 1) {
      const n = this.nodes[i];
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

export function initAuroraField(
  containerEl: HTMLElement,
  options?: InitOptions
): AuroraFieldController {
  return new AuroraFieldController(containerEl, options);
}

