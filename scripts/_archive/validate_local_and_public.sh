#!/usr/bin/env bash
set -euo pipefail

PUBLIC_URL="${PUBLIC_URL:-https://aurora-site-brown.vercel.app}"
LOCAL_URL="${LOCAL_URL:-http://localhost:4322}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}  $1"; }
warn() { echo -e "${YELLOW}WARN${NC}  $1"; }
fail() { echo -e "${RED}FAIL${NC}  $1"; exit 1; }

TMP_LOCAL="$(mktemp)"
TMP_PUBLIC="$(mktemp)"
trap 'rm -f "$TMP_LOCAL" "$TMP_PUBLIC"' EXIT

echo "======================================="
echo "AURORA LOCAL + PUBLIC VALIDATION"
echo "======================================="
echo "REPO: $(pwd)"
echo "LOCAL_URL:  $LOCAL_URL"
echo "PUBLIC_URL: $PUBLIC_URL"
echo

if [[ ! -f package.json ]]; then
  fail "No estás dentro de ~/aurora-site"
fi

echo "1. Build local"
pnpm build >/dev/null
pass "pnpm build"

echo
echo "2. Validators"
bash scripts/validation/validate_web_expression.sh >/dev/null
pass "validate_web_expression.sh"

bash scripts/validation/validate_demo_expression_claim.sh >/dev/null
pass "validate_demo_expression_claim.sh"

echo
echo "3. Fetch local HTML"
curl -fsSL "$LOCAL_URL" > "$TMP_LOCAL" || fail "No responde LOCAL_URL=$LOCAL_URL"
pass "Local home responde"

echo
echo "4. Fetch public HTML"
curl -fsSL "$PUBLIC_URL" > "$TMP_PUBLIC" || fail "No responde PUBLIC_URL=$PUBLIC_URL"
pass "Public home responde"

echo
echo "5. Contenido esperado en LOCAL"
rg -q "Evaluar una decisión" "$TMP_LOCAL" && pass "CTA nuevo presente en local" || fail "CTA nuevo NO presente en local"
rg -q "Qué cambió" "$TMP_LOCAL" && pass "Sección Qué cambió presente en local" || fail "Qué cambió NO presente en local"
rg -q "El límite humano dejó de ser suficiente\\." "$TMP_LOCAL" && pass "Headline de Qué cambió presente en local" || fail "Headline Qué cambió NO presente en local"
rg -q "aurora-logo\\.png" "$TMP_LOCAL" && pass "Logo real presente en local" || warn "No se detecta aurora-logo.png en local"

if rg -q ">DEMO<|[[:space:]]DEMO[[:space:]]" "$TMP_LOCAL"; then
  warn "Aparece DEMO en local; revisar si es sección o header"
else
  pass "No aparece DEMO residual en local"
fi

echo
echo "6. Contenido esperado en PUBLIC"
if rg -q "Evaluar una decisión" "$TMP_PUBLIC"; then
  pass "CTA nuevo presente en public"
else
  warn "CTA nuevo NO presente en public"
fi

if rg -q "Qué cambió" "$TMP_PUBLIC"; then
  pass "Sección Qué cambió presente en public"
else
  warn "Qué cambió NO presente en public"
fi

if rg -q "El límite humano dejó de ser suficiente\\." "$TMP_PUBLIC"; then
  pass "Headline Qué cambió presente en public"
else
  warn "Headline Qué cambió NO presente en public"
fi

if rg -q "Poner un movimiento bajo cálculo" "$TMP_PUBLIC"; then
  warn "Public sigue mostrando CTA viejo"
else
  pass "Public no muestra CTA viejo"
fi

if rg -q "Aurora introduce esa capacidad\\." "$TMP_PUBLIC"; then
  warn "Public sigue mostrando copy viejo"
else
  pass "Public no muestra copy viejo"
fi

if rg -q ">DEMO<|[[:space:]]DEMO[[:space:]]" "$TMP_PUBLIC"; then
  warn "Public sigue mostrando DEMO en navegación o header"
else
  pass "Public no muestra DEMO residual"
fi

echo
echo "7. Diff rápido LOCAL vs PUBLIC"
if diff -q "$TMP_LOCAL" "$TMP_PUBLIC" >/dev/null; then
  pass "Local y public coinciden"
else
  warn "Local y public NO coinciden"
fi

echo
echo "======================================="
echo "RESUMEN"
echo "======================================="
echo "Si PUBLIC da warnings y LOCAL no, te falta deploy."
echo "Si ambos dan PASS, la web quedó alineada."
echo "======================================="
