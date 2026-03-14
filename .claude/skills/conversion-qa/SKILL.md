---
description: Audit CTAs, micro-friction points, trust signals, and information order across Aurora's homepage and demo — against the standard of a user who is skeptical, busy, and has no prior context.
---

# Conversion QA

Purpose:
Evaluate Aurora's web and demo as a conversion system — from first impression to lead registration. Conversion here is not about persuasion; it is about removing friction for a user who is already open but not yet committed. This skill audits every decision point where a user could stop, doubt, or leave.

When to use:
- Before shipping homepage or demo
- When lead registration rate is low
- When CTA placement or wording is being reconsidered
- When a trust signal is being added or removed
- When the information order is being changed

Inputs:
- `src/components/AuroraLanding.astro` — homepage CTAs and flow
- `src/pages/demo.astro` — demo CTAs and lead gate
- `api/lead.ts` — lead form behavior
- Current CTA copy and placement

Process:
1. Map every CTA on the page: text, placement, visual weight, surrounding context
2. For each CTA: is the user ready to take that action at that point in the page?
3. Identify micro-friction: form fields, required fields, confirmation steps, unclear labels
4. Identify escape points: moments where the user has no clear next action
5. Audit trust signals: what signals authority or credibility? Are they in the right place?
6. Audit information order: does the user have what they need before each ask?
7. Check the lead gate in the demo: is the form minimal? Is the ask justified by what the user just experienced?
8. Check post-submission state: is confirmation clear? Is reset behavior logical?

Output format:
- CTA map: position, text, context rating (ready / premature / late)
- Micro-friction list: specific friction points with severity (High / Medium / Low)
- Escape points: moments with no clear path
- Trust signal inventory: present, missing, misplaced
- Information order violations
- Lead gate assessment: minimal / acceptable / over-asking
- Concrete fixes ranked by impact
- One-line verdict on conversion readiness

Aurora-specific decision rules:
- Aurora's conversion is institutional — the ask is "register to access," not "buy now." The tone must match.
- The only CTA on the homepage that matters is "Demo." Everything else should support arriving there.
- The lead gate must feel like access to something real, not a marketing capture form.
- Trust signals for Aurora are: the AUR-2026 registration ID, system precision, institutional copy — not logos, testimonials, or star ratings.
- Friction in the demo is acceptable if it signals rigor. Friction outside the demo is never acceptable.
- Post-submission state must be clean: confirmation, no ambiguity, no redirect confusion.
- If the user doesn't know what to do next at any point, that is a conversion failure.

Limits:
- Do not add gamification or progress indicators
- Do not propose dark patterns
- Do not add social proof elements (testimonials, case studies, logos)
- Do not add pricing or feature comparison elements
