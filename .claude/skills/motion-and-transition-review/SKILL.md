---
description: Audit Aurora's motion system — reveal animations, transition timing, scroll behavior, and cognitive load of motion — against the standard of precision without noise.
---

# Motion and Transition Review

Purpose:
Evaluate whether Aurora's motion system serves clarity or undermines it. Motion in Aurora must feel like system precision — not decoration, not delight, not entertainment. Every animation must earn its place by reinforcing the cognitive moment it accompanies. This skill audits timing, rhythm, coherence, and cognitive load of the entire motion layer.

When to use:
- After adding or modifying animations
- When motion feels heavy, slow, or distracting
- When transitions between demo phases are being reconsidered
- When the reveal system timing is being adjusted
- Before shipping major visual updates

Inputs:
- `src/components/AuroraLanding.astro` — reveal system, CSS transitions, IntersectionObserver
- `src/pages/demo.astro` — phase transitions, loader animation
- CSS custom properties related to timing and easing
- `prefers-reduced-motion` implementation

Process:
1. Map every animated element: what triggers it, what it does, how long it takes
2. Evaluate each animation's cognitive job: does it orient, emphasize, or transition? Or does it just move?
3. Check timing rhythm: do animations have a consistent easing curve? (`cubic-bezier(0.22, 1, 0.36, 1)` is the reference)
4. Audit delay chains: are staggered delays intentional and legible, or accumulative and slow?
5. Evaluate the reveal system: do `[data-reveal]`, `[data-reveal="line"]`, `[data-reveal="strong"]` feel differentiated and purposeful?
6. Evaluate demo phase transitions: are they instant, smooth, or jarring?
7. Check `prefers-reduced-motion`: does disabling motion break layout or leave orphaned states?
8. Evaluate the loader animation in the demo: does it feel like computation or like waiting?

Output format:
- Animation inventory (element, trigger, duration, easing, cognitive job)
- Timing violations (too slow / too fast / inconsistent easing)
- Delay chain problems (accumulation, orphaned states)
- Reveal system coherence rating (Precise / Acceptable / Noisy)
- Demo transition rating (Smooth / Abrupt / Overloaded)
- prefers-reduced-motion compliance (Full / Partial / Missing)
- Top optimizations ranked by cognitive impact
- One-line verdict: Precision / Acceptable / Noise

Aurora-specific decision rules:
- Motion must reinforce information hierarchy — if it doesn't, it should not exist.
- The standard easing is `cubic-bezier(0.22, 1, 0.36, 1)` — deviations must be justified.
- `data-reveal="strong"` (e.g., "El cálculo reemplaza la interpretación.") must feel like the heaviest moment — delay 340ms, maximum weight.
- The loader animation is the most critical motion moment — it must feel like real computation.
- Stagger delays above 400ms total chain are almost always too slow.
- No animation should run while the user is trying to read. Motion and reading are competing.
- `prefers-reduced-motion: reduce` must produce a fully functional, non-broken experience.

Limits:
- Do not introduce GSAP, Three.js, or Lenis — they have been removed from the stack
- Do not add particle systems, WebGL effects, or canvas animations
- Do not add motion where the current design has none, unless explicitly requested
- Do not evaluate copy or layout (use web-architecture-review)
