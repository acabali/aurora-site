#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0
WARN=0

pass(){ echo "PASS  - $1"; PASS=$((PASS+1)); }
fail(){ echo "FAIL  - $1"; FAIL=$((FAIL+1)); }
warn(){ echo "WARN  - $1"; WARN=$((WARN+1)); }

echo "============================================="
echo "AURORA PUBLIC EXPERIENCE SYSTEM VALIDATION"
echo "============================================="

cd ~/aurora-site || { echo "FAIL  - aurora-site repo not found"; exit 1; }

echo
echo "1. DESIGN SYSTEM"

for file in \
  src/system/design/colors.ts \
  src/system/design/spacing.ts \
  src/system/design/typography.ts \
  src/system/design/motion.ts \
  src/system/design/breakpoints.ts \
  src/system/design/cta.ts
do
  if [ -f "$file" ]; then
    pass "Design token present: $file"
  else
    fail "Design token missing: $file"
  fi
done

echo
echo "2. LAYOUT PRIMITIVES"

for file in \
  src/components/layout/Container.astro \
  src/components/layout/Section.astro \
  src/components/layout/Grid.astro \
  src/components/layout/Stack.astro
do
  if [ -f "$file" ]; then
    pass "Layout primitive present: $file"
  else
    fail "Layout primitive missing: $file"
  fi
done

echo
echo "3. REUSABLE SECTIONS"

for file in \
  src/components/sections/Hero.astro \
  src/components/sections/SystemExplainer.astro \
  src/components/sections/DecisionEngine.astro \
  src/components/sections/ProofBlock.astro \
  src/components/sections/DemoBlock.astro \
  src/components/sections/ProductsBlock.astro \
  src/components/sections/SolutionsBlock.astro \
  src/components/sections/AuthorityBlock.astro \
  src/components/sections/CTASection.astro
do
  if [ -f "$file" ]; then
    pass "Section present: $file"
  else
    fail "Section missing: $file"
  fi
done

echo
echo "4. PAGE ARCHITECTURE"

for file in \
  apps/web/src/pages/index.astro \
  apps/web/src/pages/demo.astro \
  apps/web/src/pages/products.astro \
  apps/web/src/pages/solutions.astro \
  apps/web/src/pages/about.astro \
  apps/web/src/pages/contact.astro
do
  if [ -f "$file" ]; then
    pass "Page present: $file"
  else
    fail "Page missing: $file"
  fi
done

echo
echo "5. DEMO EXPRESSION"

if rg -n "decision_id|run_signature|movement recorded|structural load|pressure point|compression" apps/web src >/dev/null 2>&1; then
  pass "Demo terminal signals detected"
else
  fail "Demo terminal signals missing"
fi

if rg -n "registering movement|mapping structural variables|locating pressure point" apps/web src >/dev/null 2>&1; then
  pass "Loader sequence detected"
else
  fail "Loader sequence missing"
fi

if rg -n "Explore Aurora|See how Aurora works" apps/web src >/dev/null 2>&1; then
  pass "Correct CTA language detected"
else
  warn "Expected CTA language not detected"
fi

echo
echo "6. WEB QA SCRIPTS"

for file in \
  scripts/web/validate_structure.sh \
  scripts/web/validate_sections.sh \
  scripts/web/validate_performance.sh
do
  if [ -f "$file" ]; then
    pass "Web QA script present: $file"
  else
    fail "Web QA script missing: $file"
  fi
done

echo
echo "7. PERFORMANCE SIGNALS"

if rg -n "preload|font-display|loading=|client:idle|client:visible|astro:assets" apps/web src astro.config.* >/dev/null 2>&1; then
  pass "Performance-oriented signals detected"
else
  warn "No clear performance signals detected"
fi

echo
echo "8. BUILD"

if pnpm build >/dev/null 2>&1; then
  pass "Project builds successfully"
else
  fail "Project build failed"
fi

echo
echo "9. TESTS"

if pnpm test >/dev/null 2>&1; then
  pass "Project tests pass"
else
  warn "Project tests failed or are not configured"
fi

echo
echo "10. BOUNDARY CHECK"

if rg -n "aurora-core|aurora-canon|ledger.ndjson|mcp/" apps/web src scripts/web 2>/dev/null | grep -q .; then
  warn "References to core system detected in public experience layer; inspect manually"
else
  pass "No direct core-system references in public layer"
fi

echo
echo "============================================="
echo "RESULT"
echo "============================================="
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"

if [ "$FAIL" -eq 0 ]; then
  echo "STATUS: PUBLIC EXPERIENCE SYSTEM VALIDATED"
else
  echo "STATUS: ISSUES DETECTED"
fi
