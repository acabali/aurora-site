#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "AURORA SAFE REPO CLEANUP"
echo "======================================"

cd ~/aurora-site

echo
echo "1) SIZE BEFORE"
du -sh .
echo
du -sh node_modules 2>/dev/null || true
du -sh .claude/worktrees 2>/dev/null || true
du -sh dist 2>/dev/null || true
du -sh .astro 2>/dev/null || true

echo
echo "2) GIT STATUS BEFORE"
git status --short || true

echo
echo "3) REMOVE SAFE HEAVY DIRECTORIES"
rm -rf dist
rm -rf .astro
rm -rf .claude/worktrees

echo
echo "4) REMOVE TRIVIAL JUNK"
find . -name ".DS_Store" -delete

echo
echo "5) CLEAN PACKAGE MANAGER CACHE IN PROJECT ONLY"
rm -rf node_modules/.cache 2>/dev/null || true

echo
echo "6) OPTIONAL SCRIPT ARCHIVE"
mkdir -p scripts/_archive

for f in \
  scripts/final_guardrail_vomega.sh \
  scripts/validate_aurora_v2.sh \
  scripts/checks/validate_jules_alignment.sh \
  scripts/validation/validate_jules_expression_claim.sh \
  scripts/validation/validate_local_and_public.sh \
  scripts/validation/validate_public_experience_system.sh
do
  if [ -f "$f" ]; then
    mv "$f" scripts/_archive/
    echo "archived $f"
  fi
done

echo
echo "7) SIZE AFTER CLEANUP"
du -sh .
echo
du -sh node_modules 2>/dev/null || true
du -sh .claude 2>/dev/null || true
du -sh dist 2>/dev/null || true
du -sh .astro 2>/dev/null || true

echo
echo "8) VERIFY CORE FILES STILL EXIST"
for f in \
  src/components/AuroraLanding.astro \
  src/components/AuroraField.astro \
  src/components/SystemInterface.astro \
  src/components/SystemArchitecture.astro \
  src/components/SystemStatus.astro \
  src/components/site/SiteHeader.astro \
  src/components/site/SiteFooter.astro
do
  [ -f "$f" ] && echo "OK  $f" || echo "MISS $f"
done

echo
echo "9) BUILD + VALIDATORS"
pnpm build
bash scripts/validation/validate_web_expression.sh
bash scripts/validation/validate_demo_expression_claim.sh

echo
echo "10) GIT STATUS AFTER"
git status --short || true

echo
echo "======================================"
echo "CLEANUP COMPLETE"
echo "======================================"
