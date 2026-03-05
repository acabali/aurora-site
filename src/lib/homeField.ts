type FieldState = "hero" | "system" | "misfit" | "engine" | "what" | "demo" | "products" | "idle";
type LayerName = "far" | "mid" | "near";

type FieldNode = { x:number; y:number; vx:number; vy:number; size:number };
type ProductAnchor = { x:number; y:number; radius:number; strength:number; key:string };

type LayerConfig = {
  name: LayerName;
  density: number; minNodes:number; maxNodes:number;
  nodeSize:number;
  baseSpeed:number; drag:number; noise:number;
  connectionRadius:number;
  lineWidth:number; lineAlpha:number; nodeAlpha:number;
  scrollInfluence:number; attractorInfluence:number;
  maxLinksPerNode:number; maxTotalLinks:number;
  lineColor:string; nodeColor:string;
};

type LayerState = { config: LayerConfig; nodes: FieldNode[]; grid: SpatialGrid };

const ENGINE_KEY = "__auroraHomeFieldEngine";
const MAX_DPR = 2;

const clamp = (v:number, a:number, b:number) => Math.min(b, Math.max(a, v));
const lerp = (a:number, b:number, t:number) => a + (b - a) * t;

const BASE_LAYERS: LayerConfig[] = [
  { name:"far",  density:0.000035, minNodes:58, maxNodes:280, nodeSize:0.9,  baseSpeed:7,  drag:0.992, noise:18, connectionRadius:78,  lineWidth:0.55, lineAlpha:0.050, nodeAlpha:0.20, scrollInfluence:0.010, attractorInfluence:0.30, maxLinksPerNode:3, maxTotalLinks:780,  lineColor:"rgba(255,255,255,1)", nodeColor:"rgba(255,255,255,1)" },
  { name:"mid",  density:0.000020, minNodes:40, maxNodes:180, nodeSize:1.2,  baseSpeed:11, drag:0.989, noise:26, connectionRadius:114, lineWidth:0.75, lineAlpha:0.068, nodeAlpha:0.28, scrollInfluence:0.016, attractorInfluence:0.44, maxLinksPerNode:4, maxTotalLinks:980,  lineColor:"rgba(255,255,255,1)", nodeColor:"rgba(255,255,255,1)" },
  { name:"near", density:0.000012, minNodes:26, maxNodes:120, nodeSize:1.65, baseSpeed:15, drag:0.986, noise:32, connectionRadius:150, lineWidth:0.95, lineAlpha:0.086, nodeAlpha:0.38, scrollInfluence:0.024, attractorInfluence:0.60, maxLinksPerNode:5, maxTotalLinks:1120, lineColor:"rgba(240,255,249,1)", nodeColor:"rgba(240,255,249,1)" },
];

class SpatialGrid {
  private cellSize = 1; private cols = 1; private rows = 1;
  private buckets = new Map<number, number[]>();

  prepare(w:number, h:number, cellSize:number) {
    this.cellSize = Math.max(8, cellSize);
    this.cols = Math.max(1, Math.ceil(w / this.cellSize));
    this.rows = Math.max(1, Math.ceil(h / this.cellSize));
    this.buckets.clear();
  }
  insert(i:number, x:number, y:number) {
    const cx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    const key = cy * this.cols + cx;
    const bucket = this.buckets.get(key);
    if (bucket) bucket.push(i);
    else this.buckets.set(key, [i]);
  }
  forEachNearby(x:number, y:number, fn:(i:number)=>void) {
    const cx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    for (let oy=-1; oy<=1; oy++) {
      const ny = cy + oy; if (ny<0 || ny>=this.rows) continue;
      for (let ox=-1; ox<=1; ox++) {
        const nx = cx + ox; if (nx<0 || nx>=this.cols) continue;
        const bucket = this.buckets.get(ny * this.cols + nx);
        if (!bucket) continue;
        for (let k=0; k<bucket.length; k++) fn(bucket[k]);
      }
    }
  }
}

class HomeFieldEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private width = 1; private height = 1; private dpr = 1;
  private layers: LayerState[] = [];

  private raf = 0; private lastTs = 0;

  private lastScrollY = 0; private lastScrollTs = 0; private scrollMomentum = 0;

  private mouseX = 0; private mouseY = 0; private mouseActive = false;

  private occlusionEl: HTMLElement | null = null;
  private occlusionRect: DOMRect | null = null;

  private productButtons: HTMLButtonElement[] = [];
  private hotButtons = new WeakSet<HTMLButtonElement>();
  private hotTimers = new WeakMap<HTMLButtonElement, number>();
  private productAnchors: ProductAnchor[] = [];

  private unbinds: Array<() => void> = [];

  private state: FieldState = "idle";
  private stateT = 0;              // 0..1 transición
  private targetState: FieldState = "idle";

  private introT = 0;              // 0..1 "emergencia" inicial
  private introStart = performance.now();

  private lastActiveTs = performance.now();

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha:true });
    if (!ctx) throw new Error("Aurora field: 2D canvas context unavailable");

    this.canvas = canvas;
    this.ctx = ctx;

    this.layers = BASE_LAYERS.map((config) => ({ config: { ...config }, nodes: [], grid: new SpatialGrid() }));

    this.occlusionEl = document.querySelector<HTMLElement>("[data-occlusion]");
    this.productButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-products-menu] .pm-item,[data-products] .product-item"));

    this.syncCanvas(true);
    this.refreshOcclusionRect();
    this.bindProducts();
    this.refreshProductAnchors();

    this.lastScrollY = window.scrollY;
    this.lastScrollTs = performance.now();

    this.observeSections();
    this.bindInputs();

    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;

    for (const u of this.unbinds) u();
    this.unbinds.length = 0;
  }

  private bindInputs() {
    const onResize = () => { this.syncCanvas(true); this.refreshOcclusionRect(); this.refreshProductAnchors(); this.poke(); };
    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = this.lastScrollTs ? Math.max(8, now - this.lastScrollTs) : 16;
      const v = ((y - this.lastScrollY) / dt) * 1000;
      this.scrollMomentum = clamp(this.scrollMomentum * 0.72 + v * 0.28, -2400, 2400);
      this.lastScrollY = y; this.lastScrollTs = now;
      this.refreshOcclusionRect();
      this.refreshProductAnchors();
      this.poke();
    };
    const onMove = (e: PointerEvent) => {
      this.mouseX = e.clientX; this.mouseY = e.clientY; this.mouseActive = true;
      this.poke();
    };
    const onVis = () => {
      if (document.hidden) { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; return; }
      this.lastTs = 0;
      if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive:true });
    window.addEventListener("pointermove", onMove, { passive:true });
    document.addEventListener("visibilitychange", onVis);

    this.unbinds.push(() => window.removeEventListener("resize", onResize));
    this.unbinds.push(() => window.removeEventListener("scroll", onScroll as any));
    this.unbinds.push(() => window.removeEventListener("pointermove", onMove as any));
    this.unbinds.push(() => document.removeEventListener("visibilitychange", onVis));
  }

  private observeSections() {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-home-section]"));
    if (!sections.length) return;

    const pickState = (): FieldState => {
      let best: { s: HTMLElement; score: number } | null = null;
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height * 0.5;
        const dist = Math.abs(center - this.height * 0.42);
        const score = 1 / Math.max(1, dist);
        if (!best || score > best.score) best = { s: el, score };
      }
      const id = best?.s?.id as FieldState | undefined;
      if (!id) return "idle";
      if (id === "products") return "products";
      return id;
    };

    const io = new IntersectionObserver(() => {
      const next = pickState();
      this.setState(next);
    }, { root:null, threshold:[0.1, 0.25, 0.5] });

    for (const el of sections) io.observe(el);
    this.unbinds.push(() => io.disconnect());

    // primer estado
    this.setState(pickState());
  }

  private setState(next: FieldState) {
    if (next === this.targetState) return;
    this.targetState = next;
    document.body.dataset.fieldState = next;
    this.poke();
  }

  private poke() {
    this.lastActiveTs = performance.now();
    if (!this.raf && !document.hidden) this.raf = requestAnimationFrame(this.tick);
  }

  private bindProducts() {
    for (const button of this.productButtons) {
      const markHot = () => {
        this.hotButtons.add(button);
        const t = this.hotTimers.get(button);
        if (typeof t === "number") window.clearTimeout(t);
        const timer = window.setTimeout(() => {
          this.hotButtons.delete(button);
          this.hotTimers.delete(button);
          this.refreshProductAnchors();
          this.poke();
        }, 980);
        this.hotTimers.set(button, timer);
        this.refreshProductAnchors();
        this.poke();
      };

      const clearHot = () => {
        this.hotButtons.delete(button);
        const t = this.hotTimers.get(button);
        if (typeof t === "number") { window.clearTimeout(t); this.hotTimers.delete(button); }
        this.refreshProductAnchors();
        this.poke();
      };

      button.addEventListener("pointerenter", markHot);
      button.addEventListener("focus", markHot);
      button.addEventListener("click", markHot);
      button.addEventListener("pointerleave", clearHot);
      button.addEventListener("blur", clearHot);

      this.unbinds.push(() => button.removeEventListener("pointerenter", markHot));
      this.unbinds.push(() => button.removeEventListener("focus", markHot));
      this.unbinds.push(() => button.removeEventListener("click", markHot));
      this.unbinds.push(() => button.removeEventListener("pointerleave", clearHot));
      this.unbinds.push(() => button.removeEventListener("blur", clearHot));
    }
  }

  private syncCanvas(reseed:boolean) {
    this.dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);

    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (reseed) this.reseedLayers();
  }

  private reseedLayers() {
    const area = this.width * this.height;
    for (const layer of this.layers) {
      const cfg = layer.config;
      const target = clamp(Math.round(area * cfg.density), cfg.minNodes, cfg.maxNodes);
      if (layer.nodes.length > target) layer.nodes.length = target;
      while (layer.nodes.length < target) layer.nodes.push(this.createNode(cfg));
      for (const n of layer.nodes) { n.x = clamp(n.x, 0, this.width); n.y = clamp(n.y, 0, this.height); }
    }
  }

  private createNode(cfg:LayerConfig): FieldNode {
    const speed = cfg.baseSpeed * (0.55 + Math.random() * 0.9);
    const a = Math.random() * Math.PI * 2;
    let x = Math.random() * this.width;
    let y = Math.random() * this.height;

    const blocked = this.occlusionRect;
    if (blocked) {
      const pad = 24;
      for (let i=0; i<10; i++) {
        const inside = x > blocked.left - pad && x < blocked.right + pad && y > blocked.top - pad && y < blocked.bottom + pad;
        if (!inside) break;
        x = Math.random() * this.width;
        y = Math.random() * this.height;
      }
    }

    return { x, y, vx: Math.cos(a)*speed, vy: Math.sin(a)*speed, size: cfg.nodeSize * (0.78 + Math.random() * 0.52) };
  }

  private refreshOcclusionRect() {
    if (!this.occlusionEl) { this.occlusionRect = null; return; }
    this.occlusionRect = this.occlusionEl.getBoundingClientRect();
  }

  private refreshProductAnchors() {
    const anchors: ProductAnchor[] = [];
    for (const button of this.productButtons) {
      const rect = button.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > this.height + 120) continue;
      const key = button.getAttribute("data-product") || "core";
      const hot = this.hotButtons.has(button);
      anchors.push({
        key,
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5,
        radius: hot ? 300 : 220,
        strength: hot ? 0.18 : 0.09,
      });
    }
    this.productAnchors = anchors;
  }

  private tick = (ts:number) => {
    this.raf = 0;

    if (!this.lastTs) this.lastTs = ts;
    const dt = clamp((ts - this.lastTs) / 1000, 0.001, 0.033);
    this.lastTs = ts;

    // intro "emergencia" (wuaaa): 0->1 en ~1.2s
    const introAge = (ts - this.introStart) / 1200;
    this.introT = clamp(introAge, 0, 1);

    // transición de estado
    this.stateT = lerp(this.stateT, this.state === this.targetState ? 1 : 0, 1 - Math.pow(0.0008, dt * 60));
    if (this.state !== this.targetState && this.stateT < 0.12) {
      this.state = this.targetState;
      this.stateT = 0;
    }

    this.step(dt);
    this.render(ts);

    // auto-stop idle si no hay actividad (baja CPU)
    const idleFor = ts - this.lastActiveTs;
    const shouldStop = idleFor > 2600 && Math.abs(this.scrollMomentum) < 8;
    if (!document.hidden && !shouldStop) this.raf = requestAnimationFrame(this.tick);
  };

  private step(dt:number) {
    this.scrollMomentum *= Math.pow(0.86, dt * 60);

    // “mood” por sección: cambia el campo, no el texto
    const mood = this.getMood(this.targetState);
    for (const layer of this.layers) {
      // ajustar radios y alphas suavemente (sin jumps)
      layer.config.connectionRadius = lerp(layer.config.connectionRadius, mood.radius * (layer.config.name==="near" ? 1.08 : layer.config.name==="mid" ? 1.0 : 0.92), 1 - Math.pow(0.0012, dt * 60));
      layer.config.lineAlpha = lerp(layer.config.lineAlpha, mood.lineAlpha * (layer.config.name==="near" ? 1.18 : layer.config.name==="mid" ? 1.0 : 0.86), 1 - Math.pow(0.0012, dt * 60));
      layer.config.nodeAlpha = lerp(layer.config.nodeAlpha, mood.nodeAlpha * (layer.config.name==="near" ? 1.10 : layer.config.name==="mid" ? 1.0 : 0.88), 1 - Math.pow(0.0012, dt * 60));
      layer.config.noise = lerp(layer.config.noise, mood.noise * (layer.config.name==="near" ? 1.12 : layer.config.name==="mid" ? 1.0 : 0.90), 1 - Math.pow(0.0012, dt * 60));
      this.stepLayer(layer, dt, mood);
    }
  }

  private getMood(state:FieldState) {
    // agresivo + binario: cada bloque “muta” el sistema
    switch (state) {
      case "hero":     return { radius: 154, lineAlpha: 0.085, nodeAlpha: 0.42, noise: 18, pull: 1.05 };
      case "system":   return { radius: 168, lineAlpha: 0.092, nodeAlpha: 0.44, noise: 22, pull: 1.18 };
      case "misfit":   return { radius: 182, lineAlpha: 0.098, nodeAlpha: 0.46, noise: 28, pull: 1.22 };
      case "engine":   return { radius: 196, lineAlpha: 0.108, nodeAlpha: 0.48, noise: 34, pull: 1.34 };
      case "what":     return { radius: 210, lineAlpha: 0.118, nodeAlpha: 0.50, noise: 30, pull: 1.28 };
      case "demo":     return { radius: 176, lineAlpha: 0.102, nodeAlpha: 0.46, noise: 24, pull: 1.10 };
      case "products": return { radius: 222, lineAlpha: 0.122, nodeAlpha: 0.52, noise: 26, pull: 1.44 };
      default:         return { radius: 150, lineAlpha: 0.070, nodeAlpha: 0.36, noise: 18, pull: 1.00 };
    }
  }

  private stepLayer(layer:LayerState, dt:number, mood:{pull:number}) {
    const cfg = layer.config;
    const damping = Math.pow(cfg.drag, dt * 60);
    const margin = cfg.connectionRadius * 0.35;

    const px = this.mouseActive ? (this.mouseX / this.width - 0.5) : 0;
    const py = this.mouseActive ? (this.mouseY / this.height - 0.5) : 0;
    const parallax = (cfg.name === "near" ? 22 : cfg.name === "mid" ? 14 : 8);

    for (const n of layer.nodes) {
      // ruido controlado
      n.vx += (Math.random() - 0.5) * cfg.noise * dt;
      n.vy += (Math.random() - 0.5) * cfg.noise * dt;

      // atracción por producto (cuando el user “mira” algo)
      for (const a of this.productAnchors) {
        const dx = a.x - n.x;
        const dy = a.y - n.y;
        const d2 = dx*dx + dy*dy;
        const r2 = a.radius*a.radius;
        if (d2 >= r2 || d2 < 0.001) continue;

        const d = Math.sqrt(d2);
        const ratio = 1 - d / a.radius;
        const accel = ratio * a.strength * cfg.attractorInfluence * 140 * mood.pull;

        n.vx += (dx / d) * accel * dt;
        n.vy += (dy / d) * accel * dt;
      }

      // scroll como “corriente”
      n.x += n.vx * dt;
      n.y += (n.vy + this.scrollMomentum * cfg.scrollInfluence) * dt;

      // parallax micro
      n.x += px * parallax * dt;
      n.y += py * parallax * dt;

      n.vx *= damping;
      n.vy *= damping;

      // occlusion real: rebota afuera del hero box
      this.enforceOcclusion(n, cfg, dt);

      // wrap
      if (n.x < -margin) n.x = this.width + margin;
      if (n.x > this.width + margin) n.x = -margin;
      if (n.y < -margin) n.y = this.height + margin;
      if (n.y > this.height + margin) n.y = -margin;
    }
  }

  private enforceOcclusion(n:FieldNode, cfg:LayerConfig, dt:number) {
    if (!this.occlusionRect) return;

    const pad = 18 + cfg.connectionRadius * 0.08;
    const L = this.occlusionRect.left - pad;
    const R = this.occlusionRect.right + pad;
    const T = this.occlusionRect.top - pad;
    const B = this.occlusionRect.bottom + pad;

    if (n.x > L && n.x < R && n.y > T && n.y < B) {
      const dl = Math.abs(n.x - L);
      const dr = Math.abs(R - n.x);
      const dtTop = Math.abs(n.y - T);
      const db = Math.abs(B - n.y);
      const edge = Math.min(dl, dr, dtTop, db);
      const kick = 10;

      if (edge === dl) { n.x = L - 0.5; n.vx = -Math.abs(n.vx) - kick; }
      else if (edge === dr) { n.x = R + 0.5; n.vx = Math.abs(n.vx) + kick; }
      else if (edge === dtTop) { n.y = T - 0.5; n.vy = -Math.abs(n.vy) - kick; }
      else { n.y = B + 0.5; n.vy = Math.abs(n.vy) + kick; }

      return;
    }

    const influence = 70;
    const iL = L - influence, iR = R + influence, iT = T - influence, iB = B + influence;
    if (n.x < iL || n.x > iR || n.y < iT || n.y > iB) return;

    const cx = (L + R) * 0.5;
    const cy = (T + B) * 0.5;
    const dx = n.x - cx;
    const dy = n.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) return;

    const maxR = Math.max(R - L, B - T) * 0.65 + influence;
    if (d > maxR) return;

    const ratio = 1 - d / maxR;
    const repel = ratio * cfg.attractorInfluence * 60;

    n.vx += (dx / d) * repel * dt;
    n.vy += (dy / d) * repel * dt;
  }

  private render(ts:number) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // wuaaa: emerge desde un punto y “se organiza”
    const glow = this.introT;
    const vignette = 0.18 + 0.22 * glow;

    // fondo sutil (no gradient cliché): velo + viñeta
    this.ctx.globalAlpha = vignette;
    this.ctx.fillStyle = "rgba(0,0,0,1)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;

    for (const layer of this.layers) this.drawLayer(layer, ts);

    this.ctx.globalAlpha = 1;
  }

  private drawLayer(layer:LayerState, ts:number) {
    const cfg = layer.config;
    const nodes = layer.nodes;
    if (!nodes.length) return;

    // intro emerge: comprime posiciones hacia un “seed” y expande
    const seedX = this.width * 0.52;
    const seedY = this.height * 0.46;
    const t = this.introT;
    const ease = t*t*(3 - 2*t);

    layer.grid.prepare(this.width, this.height, cfg.connectionRadius);
    for (let i=0; i<nodes.length; i++) {
      const n = nodes[i];
      const ex = lerp(seedX, n.x, ease);
      const ey = lerp(seedY, n.y, ease);
      layer.grid.insert(i, ex, ey);
    }

    const r2 = cfg.connectionRadius * cfg.connectionRadius;
    let total = 0;

    this.ctx.strokeStyle = cfg.lineColor;
    this.ctx.lineWidth = cfg.lineWidth;

    for (let i=0; i<nodes.length; i++) {
      if (total >= cfg.maxTotalLinks) break;

      const a0 = nodes[i];
      const ax = lerp(seedX, a0.x, ease);
      const ay = lerp(seedY, a0.y, ease);

      let per = 0;

      layer.grid.forEachNearby(ax, ay, (j) => {
        if (total >= cfg.maxTotalLinks) return;
        if (per >= cfg.maxLinksPerNode) return;
        if (j <= i) return;

        const b0 = nodes[j];
        const bx = lerp(seedX, b0.x, ease);
        const by = lerp(seedY, b0.y, ease);

        const dx = bx - ax;
        const dy = by - ay;
        const d2 = dx*dx + dy*dy;
        if (d2 >= r2) return;

        const d = Math.sqrt(d2);
        const ratio = 1 - d / cfg.connectionRadius;

        const pulse = 0.85 + 0.15 * Math.sin((ts/1000) * 0.9 + (i+j) * 0.02);
        this.ctx.globalAlpha = clamp(ratio * cfg.lineAlpha * pulse, 0.010, cfg.lineAlpha);

        this.ctx.beginPath();
        this.ctx.moveTo(ax, ay);
        this.ctx.lineTo(bx, by);
        this.ctx.stroke();

        per++; total++;
      });
    }

    this.ctx.fillStyle = cfg.nodeColor;
    for (let i=0; i<nodes.length; i++) {
      const n0 = nodes[i];
      const x = lerp(seedX, n0.x, ease);
      const y = lerp(seedY, n0.y, ease);

      this.ctx.globalAlpha = cfg.nodeAlpha * (0.65 + 0.35 * ease);
      this.ctx.beginPath();
      this.ctx.arc(x, y, n0.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }
}

export function initHomeSystem(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  const scope = window as Window & { [ENGINE_KEY]?: () => void };

  if (typeof scope[ENGINE_KEY] === "function") {
    scope[ENGINE_KEY]?.();
    delete scope[ENGINE_KEY];
  }

  const canvas = document.querySelector<HTMLCanvasElement>("[data-aurora-canvas]");
  if (!canvas) return () => {};

  const engine = new HomeFieldEngine(canvas);

  const cleanup = () => {
    engine.destroy();
    if (scope[ENGINE_KEY] === cleanup) delete scope[ENGINE_KEY];
  };

  scope[ENGINE_KEY] = cleanup;
  return cleanup;
}
