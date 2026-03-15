#!/usr/bin/env bash
set -euo pipefail

cd ~/aurora-site || { echo "FAIL  - aurora-site repo not found"; exit 1; }

PASS=0
FAIL=0
WARN=0

pass(){ echo "PASS  - $1"; PASS=$((PASS+1)); }
fail(){ echo "FAIL  - $1"; FAIL=$((FAIL+1)); }
warn(){ echo "WARN  - $1"; WARN=$((WARN+1)); }

echo "============================================="
echo "AURORA DEMO EXPRESSION CLAIM VALIDATION"
echo "============================================="

echo
echo "1. Core demo surface"

for file in \
  src/pages/demo.astro \
  src/components/AuroraLanding.astro
do
  if [ -f "$file" ]; then
    pass "File present: $file"
  else
    fail "Missing file: $file"
  fi
done

echo
echo "2. Decision Footprint"

if rg -n "decision_id" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "decision_id signal detected"
else
  fail "decision_id signal missing"
fi

if rg -n "protocol:\s*vΩ|protocol.*vΩ" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "protocol vΩ detected"
else
  fail "protocol vΩ missing"
fi

if rg -n "run_signature" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "run_signature detected"
else
  fail "run_signature missing"
fi

echo
echo "3. Structural reasoning language"

if rg -n "structural load" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "structural load detected"
else
  fail "structural load missing"
fi

if rg -n "pressure point" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "pressure point detected"
else
  fail "pressure point missing"
fi

if rg -n "compression mechanism|compression:" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "compression mechanism detected"
else
  fail "compression mechanism missing"
fi

if rg -n "system reading" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "system reading section detected"
else
  warn "system reading section not detected"
fi

echo
echo "4. Loader sequence"

if rg -n "registering movement" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "registering movement detected"
else
  warn "registering movement missing"
fi

if rg -n "mapping structural variables" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "mapping structural variables detected"
else
  warn "mapping structural variables missing"
fi

if rg -n "locating pressure point" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "locating pressure point detected"
else
  warn "locating pressure point missing"
fi

echo
echo "5. Ledger memory signal"

if rg -n "movement recorded" src/pages/demo.astro src/components/AuroraLanding.astro >/dev/null 2>&1; then
  pass "movement recorded detected"
else
  warn "movement recorded missing"
fi

echo
echo "6. CTA language"

if rg -n "Explore Aurora|See how Aurora works" src/pages src/components >/dev/null 2>&1; then
  pass "correct CTA language detected"
else
  fail "correct CTA language missing"
fi

if rg -n "Start using Aurora|Sign up|Get started" src/pages src/components >/dev/null 2>&1; then
  warn "forbidden SaaS CTA language detected"
else
  pass "no forbidden SaaS CTA language detected"
fi

echo
echo "7. Core boundary"

if rg -n "aurora-core|aurora-canon|ledger\.ndjson|mcp/" src pages components 2>/dev/null | grep -q .; then
  warn "core-system references detected in expression layer; inspect manually"
else
  pass "no direct core-system references detected"
fi

echo
echo "8. Build"

if pnpm build >/dev/null 2>&1; then
  pass "build successful"
else
  fail "build failed"
fi

echo
echo "============================================="
echo "RESULT"
echo "============================================="
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"

if [ "$FAIL" -eq 0 ]; then
  echo "STATUS: DEMO EXPRESSION CLAIM VALIDATED"
else
  echo "STATUS: ISSUES DETECTED"
fi
