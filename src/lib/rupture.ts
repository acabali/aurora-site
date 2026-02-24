/**
 * Ruptura: GSAP ScrollTrigger — Antes/Ahora + divider (altura 0→100%).
 * once: true, sin scrub. Si prefers-reduced-motion: línea sin animación (CSS).
 */

export function mountRupture(): void {
  if (typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const el = document.querySelector("[data-rupture]");
  if (!el) return;

  import("gsap").then(({ gsap }) => {
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      const before = el.querySelector("[data-rupture-before]");
      const now = el.querySelector("[data-rupture-now]");
      const divider = el.querySelector("[data-rupture-divider]");

      const st = { trigger: el, start: "top 85%", once: true };

      gsap.fromTo(
        before,
        { opacity: 0, y: 10 },
        { opacity: 0.85, y: 0, duration: 0.5, ease: "power2.out", scrollTrigger: st }
      );
      gsap.fromTo(
        now,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.15, scrollTrigger: st }
      );
      if (divider) {
        const isNarrow = window.innerWidth < 641;
        gsap.fromTo(
          divider,
          isNarrow ? { scaleX: 0 } : { scaleY: 0 },
          isNarrow
            ? { scaleX: 1, duration: 0.4, ease: "power2.out", scrollTrigger: st }
            : { scaleY: 1, duration: 0.4, ease: "power2.out", scrollTrigger: st }
        );
      }
    });
  });
}
