#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"

echo "======================================"
echo "AURORA REPO AUDIT PRO"
echo "ROOT: $ROOT"
echo "======================================"

cd "$ROOT"

echo
echo "1) GIT STATUS"
git status --short || true

echo
echo "2) TOP-LEVEL SIZE"
du -sh . .git node_modules public scripts .claude dist .astro 2>/dev/null || true

echo
echo "3) BIGGEST DIRECTORIES"
du -sh ./* ./.git/* 2>/dev/null | sort -hr | head -30 || true

echo
echo "4) BIGGEST TRACKED FILES"
git ls-files -z | xargs -0 du -h 2>/dev/null | sort -hr | head -40 || true

echo
echo "5) UNTRACKED FILES"
git ls-files --others --exclude-standard || true

echo
echo "6) LOCKFILES"
ls -lh package-lock.json pnpm-lock.yaml yarn.lock 2>/dev/null || true

echo
echo "7) POTENTIAL DUPLICATES / HEAVY ASSETS"
find public src docs -type f \( \
  -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.svg" \
\) -exec du -h {} + 2>/dev/null | sort -hr | head -40 || true

echo
echo "8) SCRIPTS INVENTORY"
find scripts -maxdepth 3 -type f | sort || true

echo
echo "9) EMPTY / DEAD-LIKE DIRECTORIES"
find . -type d -empty \
  ! -path "./.git/*" \
  ! -path "./node_modules/*" \
  ! -path "./.pnpm-store/*" 2>/dev/null || true

echo
echo "10) GIT OBJECTS"
git count-objects -vH || true

echo
echo "11) LOCAL BRANCHES"
git branch || true

echo
echo "12) MERGED BRANCHES"
git branch --merged || true

echo
echo "13) BUILD CHECK"
if command -v pnpm >/dev/null 2>&1; then
  pnpm build >/tmp/aurora_repo_audit_build.log 2>&1 && echo "BUILD OK (pnpm)" || { echo "BUILD FAILED (pnpm)"; cat /tmp/aurora_repo_audit_build.log; }
else
  npm run build >/tmp/aurora_repo_audit_build.log 2>&1 && echo "BUILD OK (npm)" || { echo "BUILD FAILED (npm)"; cat /tmp/aurora_repo_audit_build.log; }
fi

echo
echo "14) VALIDATORS"
bash scripts/validation/validate_web_expression.sh >/tmp/aurora_repo_audit_val1.log 2>&1 && grep "STATUS" /tmp/aurora_repo_audit_val1.log || cat /tmp/aurora_repo_audit_val1.log
bash scripts/validation/validate_demo_expression_claim.sh >/tmp/aurora_repo_audit_val2.log 2>&1 && grep "STATUS" /tmp/aurora_repo_audit_val2.log || cat /tmp/aurora_repo_audit_val2.log

echo
echo "======================================"
echo "AUDIT COMPLETE"
echo "======================================"
