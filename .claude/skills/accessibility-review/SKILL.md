---
description: Audit Aurora's web and demo for accessibility — heading hierarchy, color contrast, keyboard navigation, focus management, ARIA labels, and semantic HTML — against WCAG 2.1 AA as the minimum bar.
---

# Accessibility Review

Purpose:
Evaluate whether Aurora's web and demo are accessible to users with disabilities. Accessibility is not a courtesy — it is a baseline for any system that claims institutional credibility. A broken heading hierarchy, missing focus states, or insufficient contrast undermines the authority Aurora's design intends to project. This skill audits the current implementation against WCAG 2.1 AA as the minimum acceptable standard.

When to use:
- Before shipping homepage or demo
- After adding new sections or components
- When keyboard navigation is suspected to be broken
- When color changes are made to the design
- When interactive demo elements are added

Inputs:
- `src/components/AuroraLanding.astro`
- `src/pages/demo.astro`
- `src/styles/tokens.css` (if present)
- Any inline styles using color or typography

Process:
1. Audit heading hierarchy: H1 → H2 → H3 — is there exactly one H1? Are headings logical and non-skipped?
2. Audit color contrast: text on background, text on colored backgrounds, interactive states — minimum 4.5:1 for normal text, 3:1 for large text
3. Audit keyboard navigation: can all interactive elements be reached by Tab? In logical order?
4. Audit focus states: are focused elements visually distinct? Is `outline: none` used anywhere without a replacement?
5. Audit ARIA: are interactive elements properly labeled? Are dynamic regions announced correctly?
6. Audit form in lead gate: are inputs labeled? Are error states accessible?
7. Audit motion: does `prefers-reduced-motion` fully disable animations without breaking layout?
8. Audit semantic HTML: are `button` and `a` used correctly? Are `section`, `nav`, `main`, `footer` present?

Output format:
- Heading hierarchy map with violations
- Contrast failures: element, foreground, background, ratio, required ratio
- Keyboard navigation gaps: unreachable elements, wrong tab order
- Focus state violations: elements with no visible focus
- ARIA gaps: unlabeled interactives, missing live regions
- Form accessibility issues
- Motion compliance status
- Semantic HTML violations
- WCAG 2.1 AA pass / fail verdict per category
- Highest-priority fixes ranked by severity

Aurora-specific decision rules:
- Aurora's dark, high-contrast design should make contrast easier — verify it actually does.
- The demo form is the highest-risk area: every input must have a label, every error must be announced.
- Focus management in demo phase transitions is critical — when a phase changes, focus must go somewhere logical.
- `prefers-reduced-motion` must produce a fully functional experience — not just "no animations."
- The AUR-2026 registration ID must be readable by screen readers — it must not be visually formatted in a way that breaks spoken readout.
- Navigation must be accessible by keyboard alone — including the "DEMO" navbar link and footer links.

Limits:
- Do not propose WCAG AAA compliance (AA is the bar)
- Do not change visual design to fix contrast — flag it for design review
- Do not add ARIA roles speculatively — only add where there is a documented gap
- Do not evaluate performance or conversion (use other skills for those)
