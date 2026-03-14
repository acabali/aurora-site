---
description: Audit Aurora's event instrumentation — critical user moments tracked, naming consistency, conversion funnel coverage, and gaps in the demo lead capture flow — against the standard of actionable analytics.
---

# Analytics and Events Review

Purpose:
Evaluate whether Aurora's current instrumentation captures the events that matter for understanding user behavior, demo completion, and lead conversion. Aurora does not need a full analytics stack — it needs precise tracking of the moments that indicate intent, doubt, or commitment. This skill audits what is tracked, what is missing, and whether naming is consistent enough for analysis.

When to use:
- Before shipping demo or homepage
- When conversion data is unreliable or absent
- When a new event or funnel step is being added
- When analytics naming is being standardized
- When evaluating post-launch measurement readiness

Inputs:
- `src/components/AuroraLanding.astro` — any existing event calls
- `src/pages/demo.astro` — phase transitions, CTA clicks, lead submission
- `api/lead.ts` — lead capture payload and Supabase write
- Any existing analytics integration (Vercel Analytics, custom events)

Process:
1. Map the critical user journey: arrival → scroll → demo CTA → inputs → loader → results → lead gate → submission
2. For each step: is an event fired? What data is captured?
3. Identify untracked moments: phases with no signal (invisible to analysis)
4. Evaluate the lead capture payload: does `api/lead.ts` log enough context to reconstruct the user's demo journey?
5. Check naming consistency: are event names in camelCase or snake_case? Is naming stable across files?
6. Evaluate the Supabase write: is the `demo_leads` table capturing the fields needed for cohort analysis?
7. Identify noise: events fired too frequently or with no analytical value
8. Assess readiness: with current instrumentation, what questions can and cannot be answered post-launch?

Output format:
- User journey map with tracking status per step (Tracked / Untracked / Partially tracked)
- Critical gaps list: events that would answer key product questions but are missing
- Naming consistency rating (Consistent / Minor drift / Inconsistent)
- Lead payload completeness assessment
- Noise events (over-fired or useless)
- Questions answerable vs unanswerable with current data
- Top 5 highest-value events to add, with recommended names and payload shape
- One-line verdict: Ready for analysis / Gaps present / Flying blind

Aurora-specific decision rules:
- The demo completion rate is the single most important metric — it must be fully tracked.
- The lead form submission and its payload are the core conversion event — every field must be auditable.
- Naming convention: `aurora_[object]_[action]` (e.g., `aurora_demo_completed`, `aurora_lead_submitted`)
- The `demo_leads` Supabase table is the source of truth for lead analysis — what it doesn't capture doesn't exist.
- Vercel Analytics provides page views — that is not enough. Funnel visibility requires custom events.
- Every phase transition in the demo (Hero → Inputs → Loader → Results) must fire a distinct event.
- Abandonment tracking (user starts demo but does not submit lead) is critical and likely missing.

Limits:
- Do not implement a full analytics platform (e.g., Segment, Amplitude, Mixpanel)
- Do not add server-side tracking unless the lead API already handles it
- Do not change the `demo_leads` schema without a migration
- Do not add tracking that could compromise user privacy without explicit consent handling
