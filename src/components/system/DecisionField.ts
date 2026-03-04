type FieldAlgorithm = "core" | "scenario" | "risk" | "signal" | "ledger";
type FieldNode = { id: number; px: number; py: number };
type PositionedNode = { id: number; x: number; y: number };

const CONTROLLER_KEY = "__auroraFieldController";
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const VALID_ALGORITHMS = new Set<FieldAlgorithm>(["core", "scenario", "risk", "signal", "ledger"]);

class FieldController {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private dpr = 1;

  private nodes: FieldNode[] = [];
  private progress = 0;
  private algorithm: FieldAlgorithm = "core";
  private product = "";
  private cursorX = 0.5;
  private cursorY = 0.5;

  private lineLatent = "rgba(255,255,255,0.08)";
  private lineActive = "rgba(0,255,127,0.3)";
  private lineDominant = "rgba(123,44,255,0.74)";
  private nodeLatent = "rgba(255,255,255,0.28)";
  private nodeActive = "rgba(0,255,127,0.82)";
  private nodeDominant = "rgba(123,44,255,0.94)";

  private raf = 0;

  private observer = new MutationObserver(() => {
    this.syncState();
    this.queueRender();
  });

  private onResize = (): void => {
    this.syncSize();
    this.ensureNodes();
    this.queueRender();
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
    this.ensureNodes();
    this.syncPalette();
    this.syncState();
    this.bind();
    this.render();
  }

  destroy(): void {
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
    }

    window.removeEventListener("resize", this.onResize);
    this.observer.disconnect();

    if (this.canvas.parentNode === this.root) {
      this.root.removeChild(this.canvas);
    }
  }

  private bind(): void {
    window.addEventListener("resize", this.onResize);
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "data-field-progress",
        "data-algorithm",
        "data-field-product",
        "data-field-cursor-x",
        "data-field-cursor-y",
      ],
    });
  }

  private queueRender(): void {
    if (this.raf) return;
    this.raf = window.requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
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

  private ensureNodes(): void {
    const target = this.width < 640 ? 10 : this.width < 980 ? 14 : 20;
    while (this.nodes.length < target) {
      const id = this.nodes.length;
      const px = 0.12 + this.seed(id, 0.31) * 0.76;
      const py = 0.18 + this.seed(id, 0.73) * 0.64;
      this.nodes.push({ id, px, py });
    }
    if (this.nodes.length > target) {
      this.nodes.length = target;
    }
  }

  private seed(value: number, salt: number): number {
    const raw = Math.sin(value * 12.9898 + salt * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  }

  private syncPalette(): void {
    const style = window.getComputedStyle(document.documentElement);
    this.lineLatent = style.getPropertyValue("--field-line-latent").trim() || this.lineLatent;
    this.lineActive = style.getPropertyValue("--field-line-active").trim() || this.lineActive;
    this.lineDominant = style.getPropertyValue("--field-dominant").trim() || this.lineDominant;
    this.nodeLatent = style.getPropertyValue("--field-node-latent").trim() || this.nodeLatent;
    this.nodeActive = style.getPropertyValue("--field-node-active").trim() || this.nodeActive;
    this.nodeDominant = style.getPropertyValue("--field-node-dominant").trim() || this.nodeDominant;
  }

  private syncState(): void {
    const rawProgress = Number.parseFloat(document.body.dataset.fieldProgress ?? "0");
    this.progress = Number.isFinite(rawProgress) ? clamp(rawProgress, 0, 1) : 0;

    const rawAlgorithm = (document.body.dataset.algorithm ?? "core") as FieldAlgorithm;
    this.algorithm = VALID_ALGORITHMS.has(rawAlgorithm) ? rawAlgorithm : "core";

    this.product = (document.body.dataset.fieldProduct ?? "").trim();

    const rawX = Number.parseFloat(document.body.dataset.fieldCursorX ?? "0.5");
    const rawY = Number.parseFloat(document.body.dataset.fieldCursorY ?? "0.5");
    this.cursorX = Number.isFinite(rawX) ? clamp(rawX, 0, 1) : 0.5;
    this.cursorY = Number.isFinite(rawY) ? clamp(rawY, 0, 1) : 0.5;
  }

  private resolveNodes(): PositionedNode[] {
    const cx = this.width * (0.5 + (this.cursorX - 0.5) * 0.08);
    const cy = this.height * (0.5 + (this.cursorY - 0.5) * 0.08);

    const compression = 0.92 - this.progress * 0.24;
    const attract = this.product ? 0.24 : 0;

    let focusX = cx;
    let focusY = cy;

    if (this.algorithm === "scenario") {
      focusX = this.width * 0.34;
      focusY = this.height * 0.34;
    }
    if (this.algorithm === "risk") {
      focusX = this.width * 0.32;
      focusY = this.height * 0.62;
    }
    if (this.algorithm === "signal") {
      focusX = this.width * 0.68;
      focusY = this.height * 0.34;
    }
    if (this.algorithm === "ledger") {
      focusX = this.width * 0.66;
      focusY = this.height * 0.62;
    }

    return this.nodes.map((node, i) => {
      let x = cx + (node.px - 0.5) * this.width * compression;
      let y = cy + (node.py - 0.5) * this.height * compression;

      if (this.algorithm === "scenario") {
        const t = this.nodes.length <= 1 ? 0 : i / (this.nodes.length - 1);
        x = x * 0.5 + (this.width * (0.15 + t * 0.7)) * 0.5;
        y = y * 0.5 + (this.height * (0.33 + Math.sin(t * Math.PI) * 0.18)) * 0.5;
      }

      if (this.algorithm === "risk") {
        if (i % 3 !== 0) {
          x = x * 0.3 + this.width * 0.35 * 0.7;
          y = y * 0.3 + this.height * 0.62 * 0.7;
        }
      }

      if (this.algorithm === "signal") {
        x = x * 0.72 + cx * 0.28;
        y = y * 0.72 + cy * 0.28;
      }

      if (this.algorithm === "ledger") {
        const t = this.nodes.length <= 1 ? 0 : i / (this.nodes.length - 1);
        x = this.width * (0.12 + t * 0.76);
        y = this.height * (0.5 + ((i % 3) - 1) * 0.03);
      }

      x = x * (1 - attract) + focusX * attract;
      y = y * (1 - attract) + focusY * attract;

      return { id: node.id, x: clamp(x, 0, this.width), y: clamp(y, 0, this.height) };
    });
  }

  private drawWaves(): void {
    const lines = 3;
    for (let i = 0; i < lines; i += 1) {
      const amp = 14 + i * 7 + this.progress * 10;
      const freq = 0.008 + i * 0.003;
      const baseY = this.height * (0.38 + i * 0.13);

      this.ctx.globalAlpha = 0.08 + this.progress * 0.06;
      this.ctx.strokeStyle = i === 1 ? this.lineActive : this.lineDominant;
      this.ctx.lineWidth = i === 1 ? 1.2 : 0.9;
      this.ctx.beginPath();

      for (let x = 0; x <= this.width; x += 12) {
        const y = baseY + Math.sin(x * freq + i * 0.5) * amp;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }

      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawConnections(points: PositionedNode[]): void {
    const maxDistance = Math.min(this.width, this.height) * 0.34;
    const maxDistanceSq = maxDistance * maxDistance;

    const dominantId = Math.floor(points.length * (0.45 + this.progress * 0.25));

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

        const dominant = a.id === dominantId || b.id === dominantId;
        this.ctx.globalAlpha = dominant ? 0.26 * ratio : 0.09 * ratio;
        this.ctx.strokeStyle = dominant ? this.lineDominant : this.lineLatent;
        this.ctx.lineWidth = dominant ? 1.4 : 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawNodes(points: PositionedNode[]): void {
    const dominantId = Math.floor(points.length * (0.45 + this.progress * 0.25));

    for (const point of points) {
      const dominant = point.id === dominantId;
      this.ctx.globalAlpha = dominant ? 0.95 : 0.65;
      this.ctx.fillStyle = dominant ? this.nodeDominant : this.nodeActive;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, dominant ? 2.8 : 1.8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  private render(): void {
    this.syncPalette();
    this.syncState();

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.nodes.length === 0) return;

    const points = this.resolveNodes();
    this.drawWaves();
    this.drawConnections(points);
    this.drawNodes(points);
  }
}

export function mountDecisionField(root: HTMLElement): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const scope = window as Window & { [CONTROLLER_KEY]?: FieldController };

  if (scope[CONTROLLER_KEY]) {
    scope[CONTROLLER_KEY]?.destroy();
  }

  const controller = new FieldController(root);
  scope[CONTROLLER_KEY] = controller;

  return () => {
    controller.destroy();
    if (scope[CONTROLLER_KEY] === controller) {
      delete scope[CONTROLLER_KEY];
    }
  };
}
