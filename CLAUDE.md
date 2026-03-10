# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurora Site is a static website built with Astro, Three.js, GSAP, and Lenis. This is the public-facing web presence for Aurora—not the internal runtime or infrastructure.

**Stack:**
- Astro 5 (static output)
- Three.js for 3D/WebGL
- GSAP for animations
- @studio-freight/lenis for smooth scrolling
- Supabase for backend/database
- TypeScript (strict mode)
- Vercel deployment

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Test Claude API integration
node ops/test_claude.mjs

# Verify stack setup
./ops/check_stack.sh
```

## Environment Setup

Required environment variables (see `.env.example`):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `JULES_API_KEY`
- `CRON_SECRET`

Copy `.env.example` to `.env.local` and populate values before running locally.

## Code Architecture

### Directory Structure

```
src/
├── components/        # Reusable UI components
│   ├── home/         # Home page specific components
│   └── system/       # System-level components (DecisionField)
├── layouts/          # Page layout templates (MainLayout, PageLayout)
├── lib/              # Core utilities and integrations
│   ├── ai/           # AI provider abstractions (providers.ts)
│   ├── aurora/       # Aurora-specific logic (claude.ts integration)
│   ├── knowledge/    # Data layer (supabase.ts client)
│   ├── demoEngine.ts # Demo functionality
│   ├── demoFingerprint.ts
│   └── reveal.ts     # Animation/reveal utilities
├── pages/            # Astro routes (index, demo, /en/...)
└── styles/           # Global styles and design tokens
    ├── global.css
    └── tokens.css
```

### Key Modules

**`src/lib/aurora/claude.ts`**: Claude API integration via Anthropic SDK. Used for AI interactions throughout the site.

**`src/lib/knowledge/supabase.ts`**: Supabase client initialization. Provides database access and real-time subscriptions.

**`src/lib/ai/providers.ts`**: AI provider abstraction layer. Supports multiple AI backends.

**`src/lib/demoEngine.ts`**: Powers interactive demo experiences on the demo page.

**`src/components/system/DecisionField.astro`**: System component for decision-based interactions.

**`src/styles/tokens.css`**: Design system tokens (colors, spacing, typography). Single source of truth for visual consistency.

### Supabase

- Database migrations: `supabase/migrations/`
- Client is server-side only (Astro SSG)
- Used for knowledge storage, user data, and real-time features

### Build Output

- Static site generation: `dist/` directory
- Vercel handles deployment via `vercel.json`
- Output mode: `static` (no SSR)

## Working Principles

Read `AGENTS.md`, `ARCHITECTURE.md`, and `TASKS.md` for detailed workflow and architectural guidelines. Key principles:

1. **Minimal changes**: Only touch files directly related to the task
2. **Reuse over create**: Use existing components before creating new ones
3. **No unnecessary dependencies**: Work with the current stack
4. **Visual consistency**: Respect Aurora's design language in `tokens.css`
5. **Single source of truth**: Avoid duplication of components or logic

## Important Notes

- This repo contains only the website, not Aurora's backend runtime or infrastructure
- Pages support internationalization (`/en/` routes exist)
- No test framework currently configured
- TypeScript uses Astro's strict preset (`tsconfig.json`)
- Node version pinned in `.nvmrc`

## Aurora Web Architecture

Aurora is decision infrastructure.

Definition:
Aurora expands human capacity to create and evaluate real plans using data, patterns and evidence at scale.
Aurora tests a plan before execution.

System layers:
Core
Scenario
Risk
Signal
Ledger
Execution

Rules:

Web explains the system.
Demo proves the system.

The website must never behave like a SaaS product.

No dashboards
No pricing cards
No marketing feature grids

Homepage structure:

Hero
Paradigm Shift
System Architecture
Applications
Demo

The central visual model is Aurora Field (causal graph).

The goal of the website is cognitive clarity in under 5 seconds.

