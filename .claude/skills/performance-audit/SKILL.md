---
description: Audit Aurora web and demo for frontend performance — asset weight, render cost, animation overhead, JavaScript payload, and visible technical debt — against the standard of a fast static site.
---

# Performance Audit

Purpose:
Evaluate Aurora's web and demo performance as a frontend engineering concern. Aurora is a static site — it must load fast, render immediately, and never block. This skill audits asset weight, render cost, JavaScript payload, and animation overhead, and identifies the highest-impact optimizations available without changing the stack.

When to use:
- Before shipping homepage or demo changes
- After adding new assets, scripts, or animations
- When Time to Interactive is suspected to be high
- When bundle size increases unexpectedly
- Before a deployment to Vercel

Inputs:
- `src/components/AuroraLanding.astro`
- `src/pages/demo.astro`
- `src/lib/movementEngine.ts`
- `astro.config.mjs`
- Build output in `dist/` (if available)
- Any new images, fonts, or third-party scripts

Process:
1. Audit JavaScript payload: what scripts are loaded? Are any deferred, bundled, or blocking?
2. Audit asset weight: images (format, size, loading strategy), fonts (subsetting, swap), SVGs
3. Audit animation cost: are GSAP or CSS animations triggering layout/paint? Are they GPU-composited?
4. Audit render-blocking resources: CSS, fonts, synchronous scripts
5. Check Astro output: is the static build free of unnecessary hydration?
6. Identify dead code: unused CSS, unused JS modules, unreachable components
7. Check the demo engine: is `movementEngine.ts` executed client-side efficiently? No heavy loops?
8. Evaluate Vercel deployment config: caching headers, asset optimization, edge delivery

Output format:
- JavaScript payload inventory (scripts, size estimate, loading strategy)
- Asset weight flags (heavy images, unoptimized fonts)
- Animation render cost rating (GPU-safe / Layout-triggering / Unknown)
- Render-blocking resource list
- Dead code candidates
- Top 5 highest-impact optimizations with implementation path
- One-line verdict: Fast / Acceptable / Needs work

Aurora-specific decision rules:
- Aurora is a static site — there is no excuse for slow Time to Interactive.
- Three.js, GSAP, and Lenis have been removed from the stack — verify they are not re-introduced.
- The IntersectionObserver reveal system must not block main thread.
- `movementEngine.ts` must run in under 5ms for any input combination — it is synchronous.
- Fonts must not cause layout shift — font-display: swap is required.
- No third-party analytics scripts should run synchronously.
- Images must be WebP or AVIF where possible, with explicit width/height to prevent CLS.

Limits:
- Do not introduce new build tools or bundlers
- Do not upgrade Astro or change the static output mode
- Do not add CDN configurations outside of what Vercel provides natively
- Do not modify the deterministic engine logic for performance reasons
