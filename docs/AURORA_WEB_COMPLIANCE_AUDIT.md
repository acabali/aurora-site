# Aurora Web Compliance Audit

Spec: docs/AURORA_WEB_SPEC_FINAL.md (v2, canonical)
Date: 2026-03-10

---

## PASS

Items fully aligned with spec.

- Routes `/` and `/demo` exist and are correct
- `MainLayout.astro` navbar: single link `DEMO` → `/demo`
- `AuroraLanding.astro` footer: `Home · Demo · © 2026 Aurora`
- `MainLayout.astro` footer: `Home · Demo · © 2026 Aurora`
- Homepage contains exactly 6 narrative sections: HERO, QUÉ CAMBIÓ, DESAJUSTE, RUPTURA, AURORA, DEMO
- Hero uses structural CSS grid (`hero-grid`), no particle system
- No Three.js, GSAP, or Lenis imports in any source file
- No pricing cards, testimonials, customer logos, or dashboards in rendered output
- `/en/` route is a meta-refresh redirect to `/`, not a real page

---

## VIOLATIONS

### V1 — `src/components/AuroraLanding.astro` — Extra navbar links

Spec: "Navbar contains a single link: DEMO"

Current navbar contains 5 links:

```
QUÉ CAMBIÓ  → #que-cambio
DESAJUSTE   → #desajuste
RUPTURA     → #ruptura
AURORA      → #aurora
DEMO        → #demo
```

Four section-anchor links violate the spec. Only `DEMO` is allowed.

---

### V2 — `src/components/AuroraLanding.astro` — Duplicate CTA

Spec: "Only one CTA is allowed across the website: → Put a move under calculation"

Two CTA instances present:

- Line 50: hero section `→ Poner un movimiento bajo cálculo` (`.cta-button`)
- Line 125: demo section `→ Poner un movimiento bajo cálculo` (`.demo-button--primary`)

---

### V3 — `src/layouts/MainLayout.astro` — SaaS card/grid CSS classes

Spec: "forbidden elements: SaaS cards, product feature grids"

The following CSS classes exist in `MainLayout.astro` with no corresponding HTML elements:

```
.grid-3
.grid-2x3
.card
.card:hover
.card-icon
.card-title
.card-desc
.card-example
```

Legacy SaaS layout utilities. No elements in the current site use them.

---

### V4 — `package.json` — Forbidden animation/3D libraries installed

Spec: "Not allowed: particle systems, 3D networks, decorative animations"

Three libraries are installed as production dependencies but have zero imports across the entire codebase:

```
three               ^0.160.0   — 3D/WebGL rendering
gsap                ^3.12.2    — timeline animation
@studio-freight/lenis ^1.0.42  — smooth scroll animation
```

---

## DEAD CODE

Files present with no active imports.

| File | Status |
|---|---|
| `src/components/system/` | Empty directory — DecisionField.astro deleted, directory remains |
| `src/lib/demoEngine.ts` | Not imported by any page or component |
| `src/lib/demoFingerprint.ts` | Not imported by any page or component |
| `src/lib/ai/providers.ts` | Not imported by any page or component |
| `src/lib/aurora/claude.ts` | Not imported by any page or component |
| `src/lib/knowledge/supabase.ts` | Not imported by any page or component |

Note: `demoEngine.ts` and `demoFingerprint.ts` are demo-domain logic and may be intentional foundations for `/demo`. The remaining three (`providers.ts`, `claude.ts`, `supabase.ts`) are backend infrastructure listed in `CLAUDE.md` as part of the planned stack.

---

## ROUTE ISSUES

| Route | Status |
|---|---|
| `/` | PASS — narrative homepage |
| `/demo` | PASS — interactive demo |
| `/en/` and `/en` | LOW — meta-refresh redirects to `/`; not real pages; can be removed once SEO impact is confirmed |

---

## DEPENDENCY ISSUES

| Package | Version | Used | Action |
|---|---|---|---|
| `three` | ^0.160.0 | No | Remove |
| `gsap` | ^3.12.2 | No | Remove |
| `@studio-freight/lenis` | ^1.0.42 | No | Remove |
| `@supabase/supabase-js` | ^2.99.0 | Orphaned `supabase.ts` only | Decide |

---

## CLEANUP ACTIONS

In priority order.

### 1. `src/components/AuroraLanding.astro` — Simplify navbar

Remove four section-anchor links. Keep only:

```html
<a href="/demo">DEMO</a>
```

### 2. `src/components/AuroraLanding.astro` — Remove duplicate CTA

Remove the second CTA from the Demo section (line 125). The hero CTA (line 50) is the single allowed instance. Remove orphaned CSS: `.demo-button`, `.demo-button--primary`, `.demo-actions`.

### 3. `src/layouts/MainLayout.astro` — Remove SaaS CSS classes

Delete from the style block:

```
.grid-3, .grid-2x3, .card, .card:hover,
.card-icon, .card-title, .card-desc, .card-example
```

Also remove from the media query: `.grid-3, .grid-2x3 { grid-template-columns: 1fr; }`

### 4. `src/components/system/` — Delete empty directory

### 5. `package.json` — Remove unused dependencies

```
three, gsap, @studio-freight/lenis
```

### 6. `src/lib/` — Decide on orphaned backend modules

- `demoEngine.ts` / `demoFingerprint.ts` — keep if `/demo` will use them; delete if not
- `aurora/claude.ts`, `ai/providers.ts`, `knowledge/supabase.ts` — keep as planned foundations or delete

---

END
