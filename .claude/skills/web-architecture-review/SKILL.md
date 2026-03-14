---
description: Audit Aurora's web homepage architecture — section hierarchy, narrative order, visual-cognitive flow, and structural coherence between copy, layout, and experience intent.
---

# Web Architecture Review

Purpose:
Evaluate the structural integrity of Aurora's homepage as a communication system. The web is not a product tour — it is an argument. This skill audits whether that argument holds at every layer: section order, narrative sequence, per-screen focus, and the relationship between copy and visual hierarchy.

When to use:
- Before publishing major homepage changes
- When narrative feels unclear or jumps
- When sections feel disconnected or redundant
- When a new section is being added or removed
- When the demo CTA placement is being reconsidered

Inputs:
- `src/components/AuroraLanding.astro` (primary)
- `src/pages/index.astro`
- Section names and their current order
- Any proposed structural changes

Process:
1. Map the current section sequence: Hero → Qué cambió → Desajuste → Ruptura → Aurora → Demo
2. Evaluate each section's single cognitive job — what belief or understanding should it produce?
3. Check that each section earns the next (no jumps, no repetitions)
4. Evaluate per-screen focus: is there one clear thing per viewport band?
5. Check the ratio of copy to structure — does each section say exactly what it needs and nothing more?
6. Check the Demo section's position: does the user arrive there ready, or is it premature?
7. Evaluate the relationship between visual treatment and narrative moment

Output format:
- Section map with current cognitive job assigned to each
- Gaps or redundancies detected
- Per-section signal-to-noise rating (High / Medium / Low)
- Structural risks (e.g., sections fighting each other)
- Concrete recommendation: keep / reorder / consolidate / cut
- One-line verdict on homepage coherence

Aurora-specific decision rules:
- The homepage is an argument, not a feature list. Every section must advance a belief.
- The sequence Hero → Paradigm Shift → System → Demo is load-bearing — any reorder must justify itself.
- If a section can be removed without weakening the argument, it should be.
- No section should exist to "explain" Aurora — Aurora should be demonstrated, not described.
- The Demo section must arrive when the user is cognitively ready to act, not before.
- Clarity at 5 seconds is the primary constraint. Structure must serve that, not override it.

Limits:
- Do not rewrite copy as part of this audit
- Do not change visual design
- Do not add sections beyond the defined six
- Do not propose SaaS patterns (pricing, features grid, testimonials)
