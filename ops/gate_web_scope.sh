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

echo "== GATE: deps diff =="
git diff -- package.json pnpm-lock.yaml package-lock.json || true
if ! git diff --quiet -- package.json pnpm-lock.yaml package-lock.json; then
  echo "ABORT: deps/lockfiles cambiaron"; exit 1
fi

echo "== GATE: demo intacto =="
if ! git diff --quiet -- src/pages/demo.astro; then
  echo "ABORT: demo tocado"; exit 1
fi

echo "== GATE: narrativa intacta =="
if ! git diff --quiet -- src/content/home.ts; then
  echo "ABORT: home.ts tocado"; exit 1
fi

echo "== GATE: forbidden strings (scope only) =="
rg -n "card|panel|shadow|gradient|glow|particle|saas" "${SCOPE[@]}" && {
  echo "ABORT: forbidden string en scope"; exit 1;
} || echo "OK: 0 matches"

echo "== GATE: build =="
pnpm -s build
echo "OK"
