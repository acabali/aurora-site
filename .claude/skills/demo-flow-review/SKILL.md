---
description: Audit Aurora's interactive demo — phase progression, input clarity, loader credibility, result legibility, and lead capture friction — against conversion and trust standards.
---

# Demo Flow Review

Purpose:
Audit the Aurora demo as a conversion and credibility system. The demo is not a toy — it is proof. This skill evaluates whether each phase of the demo builds conviction, reduces friction, and moves the user toward the lead gate with trust intact.

When to use:
- Before shipping demo changes
- When completion rate feels low
- When the lead form is being modified
- When result legibility is in question
- When a new demo phase is added

Inputs:
- `src/pages/demo.astro` (primary)
- `src/lib/movementEngine.ts` (deterministic engine)
- `api/lead.ts` (lead capture)
- Phase definitions: Hero → Inputs → Loader → Results → Lead Gate

Process:
1. Map the 4 phases and their transitions — is each transition earned or abrupt?
2. Evaluate input clarity: are capital, absorption, and reversibility self-explanatory? Would a real user understand them without a tooltip?
3. Evaluate loader credibility: do the 5 lines feel like real computation, or like theater? Are the 3 lines marked ≠ INPUT believable?
4. Evaluate result legibility: is the insight paragraph scannable in under 8 seconds? Is "Ventana de corrección" clear without explanation?
5. Evaluate the 3-node relationship map: does it read as a causal graph or as decoration?
6. Evaluate the registration ritual: does AUR-2026-XXXXX feel like a real artifact, or like a fake ID?
7. Evaluate the lead gate: is "Acceder a Aurora →" earned at this point, or does it feel like a paywall?
8. Identify abandonment moments: where would a real user stop?

Output format:
- Phase-by-phase friction rating (Low / Medium / High)
- Abandonment risk points with cause
- Credibility rating per phase
- Lead gate readiness (earned / premature / missing trust signal)
- Concrete fixes ranked by impact
- One-line verdict on demo conversion readiness

Aurora-specific decision rules:
- The demo must prove the system, not sell it. Every element must feel like evidence.
- The loader must feel like real computation — if it feels like a spinner, it fails.
- The result must be specific enough that the user thinks "this is about my situation."
- The lead gate must feel like access, not a wall. The user should want to register.
- AUR-2026-XXXXX is a trust artifact — it must look institutional, not random.
- The 3-node graph must reinforce the insight, not contradict it.
- If the user arrives at the lead gate confused, the demo has failed.

Limits:
- Do not change the deterministic engine logic (movementEngine.ts)
- Do not modify the lead API schema
- Do not add gamification or progress bars
- Do not simplify inputs to the point of losing precision
