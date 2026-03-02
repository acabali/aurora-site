#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://aurora-site-brown.vercel.app}"
PROHIB="${PROHIB:-ops/prohibited_strings.txt}"

echo "== GATE 0: repo limpio =="
test -z "$(git status --porcelain=v1)" || { echo "ABORT: repo sucio"; git status --porcelain=v1; exit 1; }

echo "== GATE 1: strings prohibidos =="
test -f "$PROHIB" || { echo "ABORT: falta $PROHIB"; exit 1; }
rg -n -S -f "$PROHIB" src && { echo "ABORT: string prohibido encontrado"; exit 1; } || true

echo "== GATE 2: 'calibrar' prohibido =="
rg -n -S '\bcalibrar\b' src && { echo "ABORT: aparece 'calibrar'"; exit 1; } || true

echo "== GATE 3: build =="
pnpm build

echo "== GATE 4: smoke PROD =="
curl -s -o /dev/null -w "HOME=%{http_code}\n" -I "$BASE_URL/"
curl -s -o /dev/null -w "DEMO=%{http_code}\n" -I "$BASE_URL/demo"
curl -s -o /dev/null -w "LEAD_GET=%{http_code}\n" -X GET "$BASE_URL/api/lead"

echo "OK: gates pasaron"
