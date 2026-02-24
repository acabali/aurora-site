/**
 * Reveal mínimo: IntersectionObserver → clase .is-in
 * Solo al entrar en viewport. Nunca al cargar. Respeta prefers-reduced-motion.
 */

const REVEAL_CLASS = "is-in";

export function mountReveal(options?: { rootMargin?: string; threshold?: number }): void {
  if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") return;

  const rootMargin = options?.rootMargin ?? "0px 0px -8% 0px";
  const threshold = options?.threshold ?? 0.1;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add(REVEAL_CLASS);
      }
    },
    { rootMargin, threshold }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}
