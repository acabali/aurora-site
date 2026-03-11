# Aurora Era Experience

Stack: Astro + Three.js + GSAP + WebGL

CODEX implementa aquí.

## Styles

- `src/styles/layout.css` is the canonical shell stylesheet.
- It owns the global reset plus the shared header, footer, and shell variants used by `MainLayout`.
- Landing-specific section styling stays scoped inside `src/components/AuroraLanding.astro`.
- `global.css` and `tokens.css` were removed because they were legacy-only and not imported.
