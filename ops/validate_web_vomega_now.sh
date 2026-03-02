#!/usr/bin/env bash
set -euo pipefail

echo "== AURORA WEB vΩ VALIDATION =="

# Repo check
TOP="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ "$TOP" == "$HOME/aurora-site" ]] || { echo "FAIL: not in ~/aurora-site"; exit 1; }

BR="$(git rev-parse --abbrev-ref HEAD)"
[[ "$BR" == "main" ]] || { echo "FAIL: not on main"; exit 1; }

if git status --porcelain | grep -q .; then
  echo "FAIL: working tree dirty"
  exit 1
fi

echo "Repo OK"

# Bans
if rg -n "calibrar|Evaluación generada|Tiempo, costo, riesgo|Te ordena el problema" src public; then
  echo "FAIL: prohibited strings found"
  exit 1
fi

echo "Copy bans OK"

# Build
pnpm -s build >/dev/null
echo "Build OK"

# Prod status
BASE="https://aurora-site-brown.vercel.app"
HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
[[ "$HOME_CODE" == "200" ]] || { echo "FAIL: PROD HOME not 200"; exit 1; }

echo "PROD 200 OK"

echo "✅ VALIDATION COMPLETE"
