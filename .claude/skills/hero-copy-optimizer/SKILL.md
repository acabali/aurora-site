---
description: Evaluate Aurora's hero headline, subheadline, and above-the-fold copy against the 3-second clarity standard — institutional authority, propositional precision, and zero SaaS drift.
---

# Hero Copy Optimizer

Purpose:
Audit the hero section's copy as the primary cognitive entry point into Aurora. The hero has one job: in under 3 seconds, make the user understand what Aurora is, why it matters, and that it is serious. This skill evaluates whether the current headline and subheadline achieve that — and what must change if they don't.

When to use:
- Before any copy change in the hero
- When testing alternate headlines
- When the hero feels unclear, soft, or generic
- When the value proposition is being reconsidered
- After a brand or positioning shift

Inputs:
- Current headline text
- Current subheadline / descriptor text
- Any supporting copy above the fold
- `src/components/AuroraLanding.astro` (hero section)

Process:
1. Read the headline cold — no context. What belief does it produce in 3 seconds?
2. Classify the headline: Is it propositional (makes a claim)? Categorical (names what Aurora is)? Descriptive (explains)? The first two are acceptable; the third is not.
3. Check for SaaS drift: does the copy sound like a software product? Is there any word that could appear on a SaaS homepage? ("platform," "insights," "AI-powered," "decisions," "scale," "teams")
4. Evaluate institutional authority: does the copy sound like infrastructure, or like a pitch?
5. Check the subheadline: does it add information, or repeat the headline in different words?
6. Evaluate the 3-second clarity standard: could a strategic director understand Aurora's core function without reading anything else?
7. Evaluate what the copy implies: what does Aurora replace? What does it enable? What does it prevent?
8. Check for false precision or vagueness: is any word doing no work?

Output format:
- Headline classification (Propositional / Categorical / Descriptive)
- SaaS drift score (None / Low / Medium / High)
- Authority signal rating (Institutional / Neutral / Weak)
- 3-second clarity verdict (Pass / Marginal / Fail)
- Specific words or phrases that should be removed
- Alternate headline(s) if current fails — only if failing, never speculatively
- One-line verdict

Aurora-specific decision rules:
- Aurora is decision infrastructure. The hero must communicate infrastructure, not software.
- "Aurora expands human capacity to create and evaluate real plans using data, patterns and evidence at scale." is the source of truth definition — the hero must be consistent with this.
- The headline must survive being read by a CFO or board member who knows nothing about AI tools.
- No word that appears in standard SaaS hero copy is acceptable here.
- The subheadline must add information, not restate. If it restates, it must be cut or replaced.
- "Clarity in 5 seconds" is the primary constraint. The hero must pass it alone, without scroll.
- "El cálculo reemplaza la interpretación." is a valid reference tone for the level of authority expected.

Limits:
- Do not rewrite the entire narrative
- Do not change visual treatment or section structure
- Propose at most 2 alternate headlines if the current fails — no brainstorm lists
- Do not evaluate the CTA as part of this skill (use conversion-qa for that)
