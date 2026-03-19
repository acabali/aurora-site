# Aurora Era Experience

Stack: Astro + Three.js + GSAP + WebGL

## Operative Pipeline

This repo depends on a live `aurora-os` backend. The site must not start, smoke, build, or pass deploy checks if Aurora OS is down or misconfigured.

Required local envs in `.env.local`:

- `AURORA_OS_BASE_URL`
- `AURORA_API_KEY`
- `AURORA_API_SECRET`

Recommended local backend base URL:

```bash
AURORA_OS_BASE_URL=http://127.0.0.1:8787
```

Before working in this repo:

1. Start `aurora-os` from its own repo using its canonical command.
2. Wait until `GET ${AURORA_OS_BASE_URL}/api/system-state` returns `200` JSON with `ok=true` or `success=true` when called with `x-aurora-secret`.
3. Do not continue if the backend gate fails.

Canonical repo entrypoints:

- `npm run repo:check` validates `.env.local` and runs the backend gate.
- `npm run repo:dev` validates env, validates backend, then starts the site.
- `npm run repo:smoke` runs the canonical Aurora OS smoke test against `system-state` and `decision`.
- `npm run repo:build` validates env, validates backend, runs smoke, then builds.
- `npm run repo:deploy:check` validates env, validates backend, runs smoke, builds, and prints `ready to deploy`.

Aurora integration contract:

- `GET /api/system-state` uses `x-aurora-secret`
- `POST /api/decision` uses `x-api-key`
- `api/decision` adapts the public demo inputs into Aurora OS canonical decision payloads before relaying upstream

## Styles

- `src/styles/layout.css` is the canonical shell stylesheet.
- It owns the global reset plus the shared header, footer, and shell variants used by `MainLayout`.
- Landing-specific section styling stays scoped inside `src/components/AuroraLanding.astro`.
- `global.css` and `tokens.css` were removed because they were legacy-only and not imported.
