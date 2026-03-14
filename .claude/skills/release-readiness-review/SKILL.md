---
description: Gate Aurora's web and demo against shipping — evaluate open narrative risks, visual blockers, conversion gaps, technical debt, and accessibility failures that would embarrass the system in front of a real strategic audience.
---

# Release Readiness Review

Purpose:
Make a binary shipping decision: is Aurora's web and demo ready to be seen by a real strategic audience — investors, decision-makers, potential clients? This skill aggregates signals from all other review dimensions and produces a clear gate verdict: ship / hold / ship with conditions. No hedging, no lists of nice-to-haves. A release readiness review ends with a recommendation you can act on.

When to use:
- Before any public exposure of the site or demo
- Before sharing the URL externally
- Before a pitch, demo day, or investor meeting
- After a major sprint where multiple areas changed
- As a final check after other skills have been run

Inputs:
- Full homepage: `src/components/AuroraLanding.astro`
- Full demo: `src/pages/demo.astro`
- Lead API: `api/lead.ts`
- Build output: `dist/` (if available)
- Any recent changes not yet reviewed by other skills
- Outputs from other skill reviews (if available)

Process:
1. Narrative risk: does the homepage argument hold? Could a reader finish it confused about what Aurora is?
2. Hero risk: does the hero clear the 3-second clarity bar? Would a CFO understand it?
3. Demo risk: does the demo feel like real computation? Does the lead gate feel earned?
4. Visual risk: is the design system coherent? Is there any visual element that signals "unfinished"?
5. Conversion risk: are CTAs clear? Is the lead form working? Is post-submission state clean?
6. Performance risk: does the site load fast? Any blocking resources or heavy assets?
7. Accessibility risk: are there failures that would embarrass the system in an audit?
8. Technical risk: are there console errors, broken API calls, or dead links?
9. Analytics risk: is enough tracked to understand what happened after launch?
10. Synthesis: which of the above risks are blockers vs. acceptable for this release window?

Output format:
- Risk matrix: category, severity (Blocker / Watch / Acceptable), specific issue
- Blockers: exhaustive list of what MUST be fixed before shipping
- Watches: things to monitor post-launch
- Acceptable: known gaps that don't block this release
- Shipping verdict: SHIP / HOLD / SHIP WITH CONDITIONS
- If SHIP WITH CONDITIONS: exact list of conditions
- If HOLD: the single most important reason

Aurora-specific decision rules:
- A system that presents itself as decision infrastructure cannot have broken demos. Demo failure = hold.
- Narrative confusion is a blocker. If the reader finishes and asks "but what does it do?" — hold.
- The AUR-2026 registration ID must work correctly on every input combination. If it doesn't — hold.
- A broken lead form is a blocker. Leads are the only output of the current site.
- Performance below "acceptable" on a mid-tier connection is a blocker — Aurora must feel fast.
- Accessibility failures at WCAG AA on the lead form are blockers.
- Design system drift is a watch, not a blocker, unless it signals "unfinished" to a strategic viewer.
- Missing analytics events are a watch — launch without them if everything else is clean.

Limits:
- Do not hedge the verdict. Ship / Hold / Ship with conditions — pick one.
- Do not add items to the "fix before shipping" list that are not actual blockers
- Do not evaluate Aurora's backend runtime, infrastructure, or internal systems
- Do not propose architectural redesign as part of this review
