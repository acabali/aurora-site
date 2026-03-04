interface MagneticState {
  element: HTMLElement;
  x: number;
  y: number;
  tx: number;
  ty: number;
  onMove: (event: MouseEvent) => void;
  onLeave: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function mountMotionLayer(): () => void {
  const magneticNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
  const magneticStates: MagneticState[] = magneticNodes.map((element) => {
    const state: MagneticState = {
      element,
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      onMove: () => {},
      onLeave: () => {}
    };

    state.onMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      state.tx = nx * 12;
      state.ty = ny * 10;
    };

    state.onLeave = () => {
      state.tx = 0;
      state.ty = 0;
    };

    element.addEventListener("mousemove", state.onMove);
    element.addEventListener("mouseleave", state.onLeave);
    return state;
  });

  const revealNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          target.classList.add("is-visible");
        }
        if (entry.intersectionRatio >= 0.55) {
          const stage = target.dataset.stage;
          if (stage) document.body.dataset.story = stage;
        }
      }
    },
    { threshold: [0.2, 0.55, 0.8] }
  );

  for (const node of revealNodes) revealObserver.observe(node);

  const particleCanvas = document.createElement("canvas");
  particleCanvas.className = "motion-particles";
  particleCanvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(particleCanvas);

  const pCtx = particleCanvas.getContext("2d");
  const particles: Particle[] = [];
  const particleCount = 42;
  let width = 0;
  let height = 0;

  const resizeParticles = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    particleCanvas.width = Math.floor(width * dpr);
    particleCanvas.height = Math.floor(height * dpr);
    particleCanvas.style.width = `${width}px`;
    particleCanvas.style.height = `${height}px`;
    pCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (particles.length === 0) {
      for (let i = 0; i < particleCount; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          size: Math.random() * 1.7 + 0.6
        });
      }
    }
  };

  let raf = 0;

  const animate = () => {
    for (const state of magneticStates) {
      state.x += (state.tx - state.x) * 0.11;
      state.y += (state.ty - state.y) * 0.11;
      state.element.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
    }

    if (pCtx) {
      pCtx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x <= -20) particle.x = width + 20;
        if (particle.x >= width + 20) particle.x = -20;
        if (particle.y <= -20) particle.y = height + 20;
        if (particle.y >= height + 20) particle.y = -20;

        pCtx.beginPath();
        pCtx.fillStyle = "rgba(255,255,255,0.22)";
        pCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        pCtx.fill();
      }
    }

    raf = window.requestAnimationFrame(animate);
  };

  resizeParticles();
  animate();
  window.addEventListener("resize", resizeParticles);

  return () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener("resize", resizeParticles);
    revealObserver.disconnect();
    for (const state of magneticStates) {
      state.element.removeEventListener("mousemove", state.onMove);
      state.element.removeEventListener("mouseleave", state.onLeave);
      state.element.style.transform = "";
    }
    particleCanvas.remove();
  };
}
