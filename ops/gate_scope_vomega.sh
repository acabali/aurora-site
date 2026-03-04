#!/usr/bin/env bash
set -euo pipefail

SCOPE=(
  src/pages/index.astro
  src/layouts/PageLayout.astro
  src/styles/tokens.css
  src/styles/global.css
  src/lib/homeField.ts
  src/components/system/DecisionField.ts
)

echo "== Gate: deps/locks =="
git diff --name-only -- package.json pnpm-lock.yaml package-lock.json | cat
test -z "$(git diff --name-only -- package.json pnpm-lock.yaml package-lock.json)"

echo "== Gate: DEMO/NARRATIVA intocables (working tree) =="
git diff --name-only -- src/pages/demo.astro src/components/blocks/Demo.astro src/content/home.ts | cat
test -z "$(git diff --name-only -- src/pages/demo.astro src/components/blocks/Demo.astro src/content/home.ts)"

echo "== Gate: palabras prohibidas (SOLO scope permitido) =="
rg -n "card|panel|shadow|gradient|glow|particle|saas" "${SCOPE[@]}" && {
  echo "ABORT: match prohibido en scope permitido"
  exit 1
} || true

echo "OK: gates scope vΩ"
