---
description: Audit visual consistency across Aurora's web and demo — CSS tokens, spacing rhythm, typography hierarchy, color usage, component coherence, and state handling — against the design system defined in AuroraLanding.astro.
---

# Design System Guardian

Purpose:
Enforce visual coherence across Aurora's web presence. Aurora's design language is institutional, not decorative — every visual decision must reinforce clarity, authority, and precision. This skill audits whether the current implementation holds to that standard, or introduces noise that undermines it.

When to use:
- After adding new sections or components
- When visual inconsistency is suspected
- Before shipping the homepage or demo
- When a new color, font size, or spacing value is introduced
- When a component is reused in a new context

Inputs:
- `src/components/AuroraLanding.astro` — CSS custom properties and component definitions
- `src/styles/tokens.css` (if present)
- `src/pages/demo.astro` — visual treatment of demo phases
- Any new component or section being audited

Process:
1. Extract all CSS custom properties (--variables) used across target files
2. Identify any hardcoded values (px, rem, hex, rgba) that bypass the token system
3. Audit typography: how many font-size values exist? Are they consistent with the defined scale?
4. Audit spacing: is spacing derived from a rhythm (e.g., 8px base) or arbitrary?
5. Audit color usage: are all colors token-referenced? Is contrast maintained?
6. Audit component reuse: are similar UI patterns using the same HTML/CSS structure?
7. Check state coherence: hover, focus, active — are interactive states consistent?
8. Check the demo vs homepage: do they share the same visual language, or drift?

Output format:
- Token inventory: defined vs used
- Hardcoded value list (file:line, value, recommended token)
- Typography scale violations
- Spacing violations
- Color drift points
- Component inconsistencies
- State handling gaps
- One-line verdict: System coherent / Minor drift / Significant drift

Aurora-specific decision rules:
- Aurora's visual language is monochromatic, high-contrast, precise. No decorative color.
- Typography hierarchy must be legible at a glance — three levels maximum per page context.
- Spacing must be consistent enough to feel intentional. Arbitrary spacing destroys authority.
- The demo and homepage are one visual system — they must feel like the same product.
- Any visual element that could appear on a SaaS product page is a red flag.
- Motion and transitions are part of the design system — inconsistent timing breaks coherence.
- If a token doesn't exist for a value being introduced, a token should be created, not a hardcode.

Limits:
- Do not redesign — audit and flag only
- Do not change functional behavior while fixing visual tokens
- Do not introduce new design patterns beyond what the current system uses
- Do not evaluate copy or narrative (use hero-copy-optimizer or web-architecture-review)
