#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "== BRANCH/STATUS =="
git status -sb
echo "== BUILD =="
pnpm -s build

echo "== RESTRICTIONS =="
git diff --name-only -- src/content/home.ts src/pages/demo.astro package.json pnpm-lock.yaml package-lock.json | cat
[[ -z "$(git diff --name-only -- src/content/home.ts)" ]] || { echo "ABORT: tocaste home.ts"; exit 1; }
[[ -z "$(git diff --name-only -- src/pages/demo.astro)" ]] || { echo "ABORT: tocaste demo.astro"; exit 1; }
[[ -z "$(git diff --name-only -- package.json pnpm-lock.yaml package-lock.json)" ]] || { echo "ABORT: deps/locks tocados"; exit 1; }

echo "== RG PROHIBIDOS (scope tocado) =="
FILES="$(git diff --name-only --diff-filter=ACMR | tr '\n' ' ')"
if [[ -n "${FILES// }" ]]; then
  rg -n "card|panel|grid|shadow|gradient|glow|saas|particle" $FILES && { echo "ABORT: match prohibido"; exit 1; } || true
fi

echo "== VERIFY PROD =="
pnpm -s verify:prod
echo "OK"
