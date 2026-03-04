interface FieldNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulse: number;
}

const NODE_COUNT = 18;
const LINK_DISTANCE = 170;

export function mountDecisionFieldCanvas(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let t = 0;

  const pointer = {
    x: 0,
    y: 0,
    active: false
  };

  const nodes: FieldNode[] = [];

  const spawnNodes = () => {
    nodes.length = 0;
    for (let i = 0; i < NODE_COUNT; i += 1) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        pulse: Math.random() * Math.PI * 2
      });
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(320, rect.width);
    height = Math.max(240, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawnNodes();
  };

  const drawGrid = () => {
    ctx.strokeStyle = "rgba(108, 77, 255, 0.14)";
    ctx.lineWidth = 1;
    const step = 36;

    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawProbabilityWaves = () => {
    const center = height * 0.7;

    for (let band = 0; band < 3; band += 1) {
      const amp = 14 + band * 7;
      const freq = 0.018 + band * 0.003;
      const speed = 0.9 + band * 0.3;
      ctx.beginPath();

      for (let x = 0; x <= width; x += 5) {
        const y = center + Math.sin(x * freq + t * speed) * amp;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = band === 1 ? "rgba(0,255,163,0.52)" : "rgba(108,77,255,0.44)";
      ctx.lineWidth = band === 1 ? 1.8 : 1.1;
      ctx.stroke();
    }
  };

  const drawDecisionGraph = () => {
    const points = 14;
    ctx.beginPath();
    for (let i = 0; i < points; i += 1) {
      const x = (i / (points - 1)) * width;
      const noise = Math.sin(t * 1.7 + i * 0.7) * 18;
      const y = height * 0.25 + i * 2 + noise;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.56)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawRiskSimulation = () => {
    const bars = 18;
    const startX = width * 0.6;
    const areaW = width * 0.34;
    const barW = areaW / bars;
    const baseline = height * 0.94;

    for (let i = 0; i < bars; i += 1) {
      const oscillation = (Math.sin(t * 1.8 + i * 0.65) + 1) * 0.5;
      const value = 18 + oscillation * 74;
      const x = startX + i * barW;
      const y = baseline - value;
      const mix = Math.min(1, value / 90);
      const alpha = 0.35 + mix * 0.55;

      ctx.fillStyle = `rgba(${Math.round(108 + 147 * mix)}, ${Math.round(77 + 178 * mix)}, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(x, y, Math.max(2, barW - 2), value);
    }
  };

  const updateNodes = () => {
    for (const node of nodes) {
      const tx = pointer.active ? pointer.x : width * 0.5 + Math.sin(t * 0.4 + node.pulse) * 120;
      const ty = pointer.active ? pointer.y : height * 0.5 + Math.cos(t * 0.35 + node.pulse) * 90;

      node.vx += (tx - node.x) * 0.0006;
      node.vy += (ty - node.y) * 0.0006;

      node.vx *= 0.988;
      node.vy *= 0.988;

      node.x += node.vx;
      node.y += node.vy;

      if (node.x <= 0 || node.x >= width) node.vx *= -1;
      if (node.y <= 0 || node.y >= height) node.vy *= -1;

      node.x = Math.min(Math.max(node.x, 0), width);
      node.y = Math.min(Math.max(node.y, 0), height);
    }
  };

  const drawNetwork = () => {
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > LINK_DISTANCE) continue;
        const alpha = 1 - distance / LINK_DISTANCE;
        ctx.strokeStyle = `rgba(0,255,163,${(alpha * 0.34).toFixed(3)})`;
        ctx.lineWidth = alpha * 1.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const pulse = (Math.sin(t * 2 + node.pulse) + 1) * 0.5;
      const size = 1.8 + pulse * 2.2;
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,255,163,0.45)";
      ctx.lineWidth = 1;
      ctx.arc(node.x, node.y, size + 4 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const frame = () => {
    t += 0.016;
    ctx.clearRect(0, 0, width, height);

    drawGrid();
    drawProbabilityWaves();
    drawDecisionGraph();
    drawRiskSimulation();
    updateNodes();
    drawNetwork();

    raf = window.requestAnimationFrame(frame);
  };

  const onMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };

  const onLeave = () => {
    pointer.active = false;
  };

  resize();
  frame();

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => resize());
  observer?.observe(canvas);

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);
  window.addEventListener("resize", resize);

  return () => {
    window.cancelAnimationFrame(raf);
    observer?.disconnect();
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
    window.removeEventListener("resize", resize);
  };
}
