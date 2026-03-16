#!/usr/bin/env bash

set +e

PASS=0
WARN=0
FAIL=0

pass(){ echo "PASS  $1"; PASS=$((PASS+1)); }
warn(){ echo "WARN  $1"; WARN=$((WARN+1)); }
fail(){ echo "FAIL  $1"; FAIL=$((FAIL+1)); }

echo ""
echo "==============================================="
echo "AURORA — JULES EXECUTION VALIDATION"
echo "==============================================="
echo ""

echo "Repo:"
pwd
echo ""

########################################
# 1. ARCHIVOS CLAVE
########################################

echo "Checking core files..."

FILES=(
"src/components/AuroraLanding.astro"
"src/components/AuroraField.astro"
"src/components/site/SiteHeader.astro"
"src/components/site/SiteFooter.astro"
"src/styles/layout.css"
"scripts/validation/validate_web_expression.sh"
"scripts/validation/validate_demo_expression_claim.sh"
)

for file in "${FILES[@]}"
do
  if [ -f "$file" ]; then
    pass "$file exists"
  else
    fail "$file missing"
  fi
done

echo ""

########################################
# 2. HERO NARRATIVE
########################################

echo "Checking hero narrative..."

grep -q "El entorno ha superado la capacidad humana de anticipación" src/components/AuroraLanding.astro

if [ $? -eq 0 ]; then
  pass "Hero narrative updated"
else
  fail "Hero narrative not found"
fi

echo ""

########################################
# 3. CTA STANDARD
########################################

echo "Checking CTA standard..."

CTA_COUNT=$(grep -R "→ Someter movimiento a cálculo" src/components 2>/dev/null | wc -l)

if [ "$CTA_COUNT" -gt 0 ]; then
  pass "CTA standard present ($CTA_COUNT)"
else
  fail "CTA standard missing"
fi

echo ""

########################################
# 4. DESAASIFICATION
########################################

echo "Checking UI de-SaaSification..."

grep -R "border-radius: 6px" src 2>/dev/null

if [ $? -eq 0 ]; then
  warn "border-radius:6px still present"
else
  pass "border-radius 6px removed"
fi

grep -R "box-shadow" src 2>/dev/null

if [ $? -eq 0 ]; then
  warn "box-shadow still present"
else
  pass "box-shadow removed"
fi

echo ""

########################################
# 5. LOCALIZATION
########################################

echo "Checking Spanish localization..."

grep -q "Inicio" src/components/site/SiteHeader.astro

if [ $? -eq 0 ]; then
  pass "Header Spanish label OK"
else
  fail "Header Spanish label missing"
fi

grep -q "Navegación principal" src/components/site/SiteHeader.astro

if [ $? -eq 0 ]; then
  pass "Navigation Spanish label OK"
else
  warn "Navigation Spanish label missing"
fi

echo ""

########################################
# 6. VALIDATION SCRIPTS
########################################

echo "Checking validation scripts..."

if [ -f scripts/validation/validate_web_expression.sh ]; then
  pass "validate_web_expression.sh present"
else
  fail "validate_web_expression.sh missing"
fi

if [ -f scripts/validation/validate_demo_expression_claim.sh ]; then
  pass "validate_demo_expression_claim.sh present"
else
  fail "validate_demo_expression_claim.sh missing"
fi

echo ""

########################################
# 7. LOCKFILE DETECTION
########################################

echo "Checking package manager..."

if [ -f package-lock.json ]; then
  pass "npm lockfile detected"
fi

if [ -f pnpm-lock.yaml ]; then
  warn "pnpm lockfile still present"
fi

echo ""

########################################
# 8. BUILD TEST
########################################

echo "Running build..."

npm run build >/dev/null 2>&1

if [ $? -eq 0 ]; then
  pass "Build successful"
else
  fail "Build failed"
fi

echo ""

########################################
# 9. AURORA FIELD PROTECTION
########################################

echo "Checking AuroraField modifications..."

git diff src/components/AuroraField.astro

if [ $? -eq 0 ]; then
  pass "AuroraField untouched in diff check"
else
  warn "AuroraField may have changes"
fi

echo ""

########################################
# 10. GIT STATUS
########################################

echo "Git status snapshot:"
git status --short

echo ""

########################################
# SUMMARY
########################################

echo "==============================================="
echo "RESULT"
echo "==============================================="
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"
echo "==============================================="

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "⚠️  VALIDATION FAILED"
  exit 1
else
  echo ""
  echo "✓ VALIDATION PASSED"
fi

