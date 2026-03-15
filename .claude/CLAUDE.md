# Aurora Site — Claude Operating Context

Aurora Site is the public-facing web and demo layer for Aurora.

## Repo Identity

This repo: `~/aurora-site` — web, UX, demo, and frontend.
Infrastructure: `~/aurora-os` — separate repo, separate Claude session.
Protected runtime: `~/Aurora` — never touched, never referenced.

## Stack

- Astro 5 (static output)
- Three.js (3D / WebGL)
- GSAP (animations)
- Lenis (smooth scrolling)
- Supabase (backend / database)
- TypeScript (strict)
- Vercel (deployment)

## Key Files

| File | Role |
|---|---|
| `src/pages/index.astro` | Homepage |
| `src/pages/demo.astro` | Interactive demo |
| `src/components/system/DecisionField.astro` | Core system component |
| `src/lib/aurora/claude.ts` | Claude API integration |
| `src/lib/demoEngine.ts` | Demo logic |
| `src/lib/ai/providers.ts` | AI provider abstraction |
| `src/styles/tokens.css` | Design system tokens (single source of truth) |
| `api/lead.ts` | Lead capture endpoint |

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview built site
node ops/test_claude.mjs  # Claude API integration test
./ops/check_stack.sh      # Stack verification
```

## Claude Responsibilities

- Homepage architecture and narrative structure reviews
- Demo flow and conversion quality audits
- Design system consistency enforcement
- Copy clarity and authority evaluation
- Performance and accessibility auditing
- Release gate validation before shipping
- Analytics and event instrumentation review

## Skills Available

- `web-architecture-review` — Section hierarchy and narrative coherence
- `demo-flow-review` — Demo phase progression and lead capture
- `hero-copy-optimizer` — Above-the-fold clarity and authority
- `design-system-guardian` — Token and component consistency
- `conversion-qa` — CTA, friction, and trust signal audit
- `performance-audit` — Asset weight, JS payload, render cost
- `motion-and-transition-review` — Animation system and cognitive load
- `analytics-and-events-review` — Event instrumentation and funnel coverage
- `accessibility-review` — WCAG 2.1 AA compliance
- `release-readiness-review` — Ship / Hold gate

## Agents Available

- `web-critic` — Homepage as argument and communication system
- `demo-conversion-analyst` — Demo trust and conversion optimization
- `design-system-enforcer` — Token and component discipline
- `performance-and-a11y-auditor` — Speed and accessibility combined
- `release-gate-reviewer` — Binary ship verdict with conditions

## Protected Paths (require explicit approval)

- `.env.local`, `.env.vercel`, `.env.*`
- `.claude/settings.json`
- `supabase/migrations/`
- `vercel.json`
- `package.json`, `pnpm-lock.yaml`

## Validation Gates

Before shipping or deploying:

```bash
npm run build
node ops/test_claude.mjs
./ops/check_stack.sh
```

## Aurora Web Rules

The website must never behave like a SaaS product.
- No dashboards, no pricing cards, no marketing feature grids.
- Web explains the system. Demo proves the system.
- Central visual: Aurora Field (causal graph).
- Goal: cognitive clarity in under 5 seconds.

Homepage structure:
1. Hero
2. Paradigm Shift
3. System Architecture
4. Applications
5. Demo

Design source of truth: `src/styles/tokens.css`

## Boundary: Infra Skills Live in aurora-os

Runtime, MCP, scheduler, ledger, and decision engine skills live in `aurora-os/.claude/`.
Do not apply infra skills here. Open a separate Claude session in `~/aurora-os`.
