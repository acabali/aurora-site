# Aurora Site

Static Aurora surface and demo relay for a live `aurora-os` backend.

## Required env

Set these in `.env.local`:

- `AURORA_OS_BASE_URL`
- `AURORA_API_KEY`
- `AURORA_API_SECRET`

Local development must use:

```bash
AURORA_OS_BASE_URL=http://127.0.0.1:8787
```

Production must use a persistent Aurora OS host.

- Do not use `localhost`.
- Do not use `.trycloudflare.com`.
- Do not use placeholders or fake URLs.

## Recommended commands

- `npm run repo:dev`
- `npm run repo:smoke`
- `npm run repo:build`
- `npm run repo:deploy:check`

Pipeline order:

1. `repo:env`
2. `repo:backend`
3. `repo:smoke`
4. `repo:build`
5. `repo:deploy:check`

Rule:

- Do not continue if the backend gate fails.

## Backend contract

- `GET /api/system-state` relays to Aurora OS with `x-aurora-secret`.
- `POST /api/decision` relays to Aurora OS with `x-api-key`.
- The relay aborts on HTML responses, bad JSON, placeholder hosts, dead quick tunnels, and upstream `502/503/504/530` failures.
- The demo submits the real current payload and normalizes legacy reversibility inputs into the canonical `low|medium|high` contract before relaying upstream.

## Home canon

- `design/aurora-home-v2.html` is the visual and narrative source of truth.
- The Astro home routes render directly from that canon without rewriting the macro layout or copy.

## Stable deploy rule

- A stable deploy is only valid if `AURORA_OS_BASE_URL` points to a persistent backend host.
- Local `127.0.0.1` is valid for `repo:dev` only.
- Quick tunnels are not a final deployment strategy.

## Activation flow (persistent backend)

From Aurora root:

```bash
# 1. Deploy aurora-os to Railway/Render/Fly, get URL
# 2. Run post-host-setup in aurora-os (validates, saves backend-url.txt)
cd repos/aurora-os && ./scripts/post-host-setup.sh https://YOUR-URL

# 3. Connect aurora-site (or use master script from Aurora root)
cd ../aurora-site && ./scripts/connect-backend.sh

# Or one-shot from Aurora root:
./scripts/aurora_activate_backend.sh https://YOUR-URL
```
