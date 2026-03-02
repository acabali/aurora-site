#!/usr/bin/env bash
set -euo pipefail

echo "== AURORA PRE-CODEX LOCK VALIDATION (MASTER) =="

# 0) identidad repo
TOP="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ "$TOP" != "$HOME/aurora-site" ]]; then
  echo "FAIL: not in ~/aurora-site"
  echo "top=$TOP"
  exit 1
fi
echo "Repo: $TOP"

# 1) working tree limpio
if [[ -n "$(git status --porcelain)" ]]; then
  echo "FAIL: working tree dirty"
  git status -sb
  exit 1
fi
echo "OK: git clean"

# 2) scripts obligatorios existen + ejecutables
REQ=(
  "ops/ban_copy_guard.sh"
  "ops/guard_home_ts_immutable.sh"
  "ops/repo_hygiene_check.sh"
  "ops/qa_prod_dropdown.sh"
  "ops/validate_web_vomega_full.sh"
)
for f in "${REQ[@]}"; do
  [[ -f "$f" ]] || { echo "FAIL: missing $f"; exit 1; }
done
chmod +x ops/*.sh || true
echo "OK: scripts present"

# 3) higiene repo
./ops/repo_hygiene_check.sh
echo "OK: repo hygiene"

# 4) narrativa inmutable (no tocada)
./ops/guard_home_ts_immutable.sh
echo "OK: home.ts immutable"

# 5) copy bans (src/public únicamente)
./ops/ban_copy_guard.sh
echo "OK: copy bans"

# 6) deps intocables
if git diff --name-only -- package.json pnpm-lock.yaml | rg -q '.'; then
  echo "FAIL: deps changed"
  git diff -- package.json pnpm-lock.yaml
  exit 1
fi
echo "OK: deps unchanged"

# 7) build local
pnpm -s build >/dev/null
echo "OK: build"

# 8) validación full web vΩ (incluye PROD html + bindings)
./ops/validate_web_vomega_full.sh
echo "OK: full web validation"

echo "✅ MASTER VALIDATION COMPLETE (READY FOR CODEX)"
