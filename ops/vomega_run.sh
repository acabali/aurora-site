#!/usr/bin/env bash
set -euo pipefail

echo "== AURORA vΩ RUN =="
date
echo

echo "== REPO =="
pwd
echo

echo "== GIT =="
git rev-parse --abbrev-ref HEAD
git status -sb
echo "HEAD: $(git rev-parse --short HEAD)"
echo

echo "== FETCH ORIGIN =="
git fetch origin --prune
echo "origin/main: $(git rev-parse --short origin/main)"
echo

echo "== GUARDS (hard) =="
DIFF_FILES="$(git diff --name-only origin/main...HEAD || true)"
echo "$DIFF_FILES" | sed '/^$/d' || true
echo

fail() { echo "ABORT: $1"; exit 1; }

echo "$DIFF_FILES" | rg -q '^src/content/home\.ts$' && fail "src/content/home.ts fue modificado (PROHIBIDO)"
echo "$DIFF_FILES" | rg -q '^src/pages/demo\.astro$' && fail "demo.astro fue modificado (PROHIBIDO)"
echo "$DIFF_FILES" | rg -q '^(package\.json|pnpm-lock\.yaml)$' && fail "dependencias tocadas (PROHIBIDO)"

echo "OK: no tocaste home.ts / demo.astro / deps"
echo

echo "== HOME MUST-NOT CONTAIN (structural) =="
rg -n "Productos|Soluciones" src/pages/index.astro && fail "HOME contiene 'Productos' o 'Soluciones' (SaaS smell)"
echo "OK: sin Productos/Soluciones en HOME"
echo

echo "== BUILD =="
pnpm build
echo

echo "== DEPLOY PREVIEW (vercel) =="
OUT="$(vercel --yes 2>&1 | tee /dev/stderr)"
URL="$(echo "$OUT" | rg -o 'https://[a-z0-9-]+\.vercel\.app' | tail -n 1 || true)"
[[ -z "${URL}" ]] && fail "no pude extraer URL del output de vercel"
echo
echo "PREVIEW_URL=$URL"
echo

echo "== SMOKE =="
curl -sS -o /dev/null -w "HOME %{http_code}\n" "$URL/"
curl -sS -o /dev/null -w "DEMO %{http_code}\n" "$URL/demo"
curl -sS -o /dev/null -w "LEAD_GET %{http_code}\n" "$URL/api/lead" || true
echo

echo "== HEADERS (HOME) =="
curl -sSI "$URL/" | rg -n 'HTTP/|content-type:|strict-transport-security:|cache-control:|x-vercel-|server:' || true
echo

echo "== DONE =="
echo "Preview: $URL"
