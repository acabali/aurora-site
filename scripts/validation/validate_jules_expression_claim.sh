#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0
WARN=0

pass(){ echo "PASS  $1"; PASS=$((PASS+1)); }
fail(){ echo "FAIL  $1"; FAIL=$((FAIL+1)); }
warn(){ echo "WARN  $1"; WARN=$((WARN+1)); }

echo "======================================="
echo "JULES EXPRESSION LAYER CLAIM VALIDATION"
echo "======================================="

echo
echo "1. Demo surface"

[ -f src/pages/demo.astro ] && pass "demo page exists" || fail "demo page missing"

echo
echo "2. Decision Footprint"

rg -q "decision_id" src && pass "decision_id present" || fail "decision_id missing"
rg -q "run_signature" src && pass "run_signature present" || fail "run_signature missing"
rg -q "protocol.*vΩ" src && pass "protocol vΩ present" || fail "protocol vΩ missing"

echo
echo "3. Structural reasoning language"

rg -q "structural load" src && pass "structural load present" || fail "structural load missing"
rg -q "pressure point" src && pass "pressure point present" || fail "pressure point missing"
rg -q "compression mechanism|compression:" src && pass "compression mechanism present" || fail "compression mechanism missing"

echo
echo "4. Loader sequence"

rg -q "registering movement" src && pass "registering movement present" || warn "registering movement missing"
rg -q "mapping structural variables" src && pass "mapping structural variables present" || warn "mapping structural variables missing"
rg -q "locating pressure point" src && pass "locating pressure point present" || warn "locating pressure point missing"

echo
echo "5. Ledger memory signal"

rg -q "movement recorded" src && pass "movement recorded present" || warn "movement recorded missing"

echo
echo "6. CTA audit"

rg -q "Someter movimiento a cálculo" src && pass "correct CTA language present" || fail "CTA not compliant"

if rg -q "Start using Aurora\|Get started\|Sign up" src; then
  warn "SaaS CTA language detected"
else
  pass "no SaaS CTA language"
fi

echo
echo "7. Validation script present"

[ -f scripts/validation/validate_web_expression.sh ] && pass "validation script exists" || fail "validation script missing"

echo
echo "8. Build"

if npm run build >/dev/null 2>&1; then
  pass "build successful"
else
  fail "build failed"
fi

echo
echo "======================================="
echo "RESULT"
echo "======================================="
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"

if [ "$FAIL" -eq 0 ]; then
  echo "STATUS: JULES CLAIM VERIFIED"
else
  echo "STATUS: CLAIM NOT VERIFIED"
fi
