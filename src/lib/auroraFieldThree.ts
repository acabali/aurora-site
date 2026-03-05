import * as THREE from "three";

type MountArgs = { root: Element; canvas: HTMLCanvasElement };

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function getSectionStages() {
  const ids = ["hero", "system", "misfit", "engine", "what", "demo"];
  const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  if (!els.length) return [];
  return els.map((el, i) => ({ el, i, id: el.id }));
}

export function mountAuroraField({ root, canvas }: MountArgs) {
  // Basic sizing
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Geometry: points + lines (dynamic)
  const N = 96; // nodes
  const positions = new Float32Array(N * 3);
  const velocities = new Float32Array(N * 3);

  // Initialize in a flat-ish volume
  for (let i = 0; i < N; i++) {
    const x = (Math.random() - 0.5) * 6;
    const y = (Math.random() - 0.5) * 3.2;
    const z = (Math.random() - 0.5) * 2.2;
    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.0025;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0025;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0015;
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMat = new THREE.PointsMaterial({
    size: 0.028,
    sizeAttenuation: true,
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  const points = new THREE.Points(pointsGeo, pointsMat);
  scene.add(points);

  // Lines: connect neighbors under threshold
  const maxEdges = 1200;
  const linePositions = new Float32Array(maxEdges * 2 * 3);
  const lineOpacities = new Float32Array(maxEdges * 2);

  const linesGeo = new THREE.BufferGeometry();
  linesGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  linesGeo.setAttribute("a", new THREE.BufferAttribute(lineOpacities, 1));

  const linesMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(0x7c5cff) }, // violet
      uIntensity: { value: 1.0 },
    },
    vertexShader: `
      attribute float a;
      varying float vA;
      void main() {
        vA = a;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying float vA;
      void main() {
        float alpha = vA * 0.35 * uIntensity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });

  const lines = new THREE.LineSegments(linesGeo, linesMat);
  scene.add(lines);

  // Lights (subtle)
  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);

  // Interaction state
  let w = 1, h = 1;
  let running = true;
  let t0 = performance.now();

  const mouse = { x: 0, y: 0, active: false };
  const target = new THREE.Vector3(0, 0, 0);

  // Scroll stage
  const stages = getSectionStages();
  let stage = 0;
  const stageMix = { value: 0 };

  function resize() {
    const rect = root.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function updateStage() {
    if (!stages.length) return;
    const vh = window.innerHeight || 1;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (const s of stages) {
      const r = s.el.getBoundingClientRect();
      const center = r.top + r.height * 0.35;
      const dist = Math.abs(center - vh * 0.45);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = s.i;
      }
    }
    stage = bestIdx;
  }

  // Stage palette + behavior presets
  const stagePresets = [
    { color: 0x2eff7b, intensity: 0.9, drift: 1.0, pull: 0.8 }, // hero green
    { color: 0x7c5cff, intensity: 1.0, drift: 1.05, pull: 0.9 }, // system violet
    { color: 0xffffff, intensity: 0.85, drift: 0.95, pull: 0.7 }, // misfit white
    { color: 0x7c5cff, intensity: 1.15, drift: 1.15, pull: 1.05 }, // engine violet stronger
    { color: 0x2eff7b, intensity: 1.05, drift: 1.05, pull: 0.95 }, // what green
    { color: 0xffffff, intensity: 0.8, drift: 0.9, pull: 0.6 }, // demo calm
  ];

  function applyStage() {
    const p = stagePresets[clamp(stage, 0, stagePresets.length - 1)];
    (linesMat.uniforms.uColor.value as THREE.Color).setHex(p.color);
    linesMat.uniforms.uIntensity.value = p.intensity;
    // points opacity small shift
    pointsMat.opacity = 0.55 + (p.intensity - 0.8) * 0.12;
  }

  function step(dt: number) {
    // Dynamics
    const p = stagePresets[clamp(stage, 0, stagePresets.length - 1)];
    const drift = p.drift;
    const pull = p.pull;

    // Mouse target in NDC -> world-ish
    if (mouse.active) {
      target.set(mouse.x * 2.2, -mouse.y * 1.4, 0);
    } else {
      target.set(0, 0, 0);
    }

    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      let x = positions[ix + 0];
      let y = positions[ix + 1];
      let z = positions[ix + 2];

      // Mild wander
      velocities[ix + 0] += (Math.random() - 0.5) * 0.00012 * drift;
      velocities[ix + 1] += (Math.random() - 0.5) * 0.00012 * drift;
      velocities[ix + 2] += (Math.random() - 0.5) * 0.00008 * drift;

      // Pull towards center to avoid drift-out
      velocities[ix + 0] += (-x) * 0.00008 * pull;
      velocities[ix + 1] += (-y) * 0.00008 * pull;
      velocities[ix + 2] += (-z) * 0.00006 * pull;

      // Mouse influence (local distortion)
      const dx = x - target.x;
      const dy = y - target.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1.6) {
        const f = (1.6 - d2) * 0.0009;
        velocities[ix + 0] += dx * f;
        velocities[ix + 1] += dy * f;
      }

      // Integrate
      x += velocities[ix + 0] * (dt * 60);
      y += velocities[ix + 1] * (dt * 60);
      z += velocities[ix + 2] * (dt * 60);

      // Damp + bounds
      velocities[ix + 0] *= 0.965;
      velocities[ix + 1] *= 0.965;
      velocities[ix + 2] *= 0.972;

      const bx = 3.2, by = 1.9, bz = 1.3;
      if (x < -bx || x > bx) velocities[ix + 0] *= -0.9;
      if (y < -by || y > by) velocities[ix + 1] *= -0.9;
      if (z < -bz || z > bz) velocities[ix + 2] *= -0.9;

      positions[ix + 0] = clamp(x, -bx, bx);
      positions[ix + 1] = clamp(y, -by, by);
      positions[ix + 2] = clamp(z, -bz, bz);
    }

    (pointsGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

    // Rebuild edges
    const thresh = prefersReducedMotion() ? 0.85 : 1.05;
    let e = 0;
    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      const x1 = positions[ix + 0], y1 = positions[ix + 1], z1 = positions[ix + 2];
      for (let j = i + 1; j < N; j++) {
        const jx = j * 3;
        const dx = x1 - positions[jx + 0];
        const dy = y1 - positions[jx + 1];
        const dz = z1 - positions[jx + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < thresh * thresh) {
          if (e >= maxEdges) break;
          const a = 1 - Math.sqrt(d2) / thresh;
          const k = e * 6;
          linePositions[k + 0] = x1;
          linePositions[k + 1] = y1;
          linePositions[k + 2] = z1;
          linePositions[k + 3] = positions[jx + 0];
          linePositions[k + 4] = positions[jx + 1];
          linePositions[k + 5] = positions[jx + 2];
          lineOpacities[e * 2 + 0] = a;
          lineOpacities[e * 2 + 1] = a;
          e++;
        }
      }
      if (e >= maxEdges) break;
    }
    // Zero remaining
    for (let k = e * 6; k < linePositions.length; k++) linePositions[k] = 0;
    for (let k = e * 2; k < lineOpacities.length; k++) lineOpacities[k] = 0;

    (linesGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (linesGeo.getAttribute("a") as THREE.BufferAttribute).needsUpdate = true;

    // Camera micro motion
    const tt = (performance.now() - t0) * 0.0002;
    camera.position.x = Math.sin(tt) * 0.06;
    camera.position.y = Math.cos(tt) * 0.04;
    camera.lookAt(0, 0, 0);
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.033, (now - t0) / 1000);
    t0 = now;

    applyStage();
    if (!prefersReducedMotion()) step(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // Observers / events
  const ro = new ResizeObserver(() => resize());
  ro.observe(root);

  const onScroll = () => {
    updateStage();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const onMove = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (ev.clientX - r.left) / Math.max(1, r.width) - 0.5;
    mouse.y = (ev.clientY - r.top) / Math.max(1, r.height) - 0.5;
    mouse.active = true;
  };
  const onLeave = () => (mouse.active = false);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });

  const onVis = () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  };
  document.addEventListener("visibilitychange", onVis);

  // Initial
  resize();
  updateStage();
  requestAnimationFrame(frame);

  // Cleanup (rare)
  return () => {
    ro.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVis);
    renderer.dispose();
  };
}
