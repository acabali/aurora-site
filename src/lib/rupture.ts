/**
 * Ruptura (Split block): GSAP ScrollTrigger
 * Antes → aparece; Ahora → aparece con leve delay.
 * once: true, sin scrub, sin parallax. Respeta prefers-reduced-motion.
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
      if (!before || !now) return;

      gsap.fromTo(
        before,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      );
      gsap.fromTo(
        now,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: 0.15,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      );
    });
  });
}
