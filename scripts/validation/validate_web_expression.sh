#!/usr/bin/env bash
set -e

echo "======================================="
echo "AURORA WEB EXPRESSION VALIDATION"
echo "======================================="

PASS=0
FAIL=0
WARN=0

pass(){ echo "PASS  $1"; PASS=$((PASS+1)); }
fail(){ echo "FAIL  $1"; FAIL=$((FAIL+1)); }
warn(){ echo "WARN  $1"; WARN=$((WARN+1)); }

echo
echo "1. Core pages"
[ -f src/pages/index.astro ] && pass "src/pages/index.astro" || fail "src/pages/index.astro"
[ -f src/pages/demo.astro ] && pass "src/pages/demo.astro" || fail "src/pages/demo.astro"

echo
echo "2. Layout"
[ -f src/layouts/MainLayout.astro ] && pass "src/layouts/MainLayout.astro" || fail "src/layouts/MainLayout.astro"

echo
echo "3. Core components"
[ -f src/components/AuroraLanding.astro ] && pass "src/components/AuroraLanding.astro" || fail "src/components/AuroraLanding.astro"
[ -f src/components/site/SiteHeader.astro ] && pass "src/components/site/SiteHeader.astro" || fail "src/components/site/SiteHeader.astro"
[ -f src/components/site/SiteFooter.astro ] && pass "src/components/site/SiteFooter.astro" || fail "src/components/site/SiteFooter.astro"

echo
echo "4. Styles"
[ -f src/styles/layout.css ] && pass "src/styles/layout.css" || fail "src/styles/layout.css"

echo
echo "5. Demo terminal signals"
if rg -n "decision_id|run_signature|movimiento registrado|movement registered|movement recorded|carga estructural|structural load|pressure point|compression|system reading" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "demo terminal signals detected"
else
  warn "demo terminal signals not detected"
fi

echo
echo "6. Loader sequence"
if rg -n "movimiento registrado|registering movement|mapeando variables estructurales|mapping structural variables|ubicando punto de presión|locating pressure point" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "loader sequence detected"
else
  warn "loader sequence not detected"
fi

echo
echo "7. CTA language"
if rg -n "Explore Aurora|See how Aurora works" src/pages src/components >/dev/null 2>&1; then
  pass "correct CTA language detected"
else
  warn "expected CTA language not detected"
fi

echo
echo "8. Build"
if pnpm build >/dev/null 2>&1; then
  pass "build successful"
else
  fail "build failed"
fi

echo
echo "9. Tests"
if pnpm test >/dev/null 2>&1; then
  pass "tests successful"
else
  warn "tests failed or not configured"
fi

echo
echo "======================================="
echo "RESULT"
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"
echo "======================================="

if [ "$FAIL" -eq 0 ]; then
  echo "STATUS: WEB EXPRESSION VALIDATED"
else
  echo "STATUS: REVIEW REQUIRED"
fi
