#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$HOME/aurora-site"
PUBLIC_URL="https://aurora-site-brown.vercel.app"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}  $1"; }
warn() { echo -e "${YELLOW}WARN${NC}  $1"; }
fail() { echo -e "${RED}FAIL${NC}  $1"; exit 1; }

cd "$PROJECT_ROOT" || fail "No existe $PROJECT_ROOT"

echo "========================================"
echo "AURORA FINAL GUARDRAIL vΩ"
echo "========================================"
echo "Repo: $(pwd)"
echo

[[ -f package.json ]] || fail "No estás en aurora-site"

echo "1. Limpieza mínima"
rm -f .DS_Store
rm -rf dist
pass "dist limpiado"

echo
echo "2. Verificar archivos críticos"
for f in \
  src/components/AuroraLanding.astro \
  src/components/AuroraField.astro \
  src/components/SystemInterface.astro \
  src/components/SystemArchitecture.astro \
  src/components/SystemStatus.astro \
  src/components/site/SiteHeader.astro \
  src/styles/layout.css
do
  [[ -f "$f" ]] && pass "$f existe" || fail "$f falta"
done

echo
echo "3. Prohibiciones estructurales"
[[ ! -f src/components/DecisionPreview.astro ]] && pass "DecisionPreview no existe" || fail "DecisionPreview sigue existiendo"

if rg -n "card|feature-grid|testimonial|pricing|book a demo|all-in-one|seamless|effortless" src >/dev/null 2>&1; then
  warn "Se detectaron strings con olor a landing/SaaS. Revisar salida:"
  rg -n "card|feature-grid|testimonial|pricing|book a demo|all-in-one|seamless|effortless" src || true
else
  pass "No se detectan strings SaaS obvios"
fi

echo
echo "4. Motion intocable"
if ! git diff --quiet -- src/components/AuroraField.astro; then
  fail "AuroraField.astro fue modificado. El motion no se toca."
else
  pass "AuroraField.astro intacto"
fi

echo
echo "5. Verificar narrativa mínima publicada en código"
rg -q "El límite humano ya no alcanza|Probás todo menos el plan|Probas todo menos el plan" src && pass "Hero presente en código" || fail "Hero no encontrado en src"
rg -q "Aurora somete una decisión|cálculo estructural" src && pass "Subline de sistema presente" || warn "Subline exacta no encontrada"
rg -q "SYSTEM ACTIVE" src && pass "System status presente" || fail "SYSTEM ACTIVE no encontrado"
rg -q "/demo" src/components/AuroraLanding.astro && pass "Enlace a demo presente" || fail "No hay enlace a demo en AuroraLanding"

echo
echo "6. Build"
pnpm build >/dev/null
pass "pnpm build"

echo
echo "7. Validadores internos"
bash scripts/validation/validate_web_expression.sh >/dev/null
pass "validate_web_expression.sh"

bash scripts/validation/validate_demo_expression_claim.sh >/dev/null
pass "validate_demo_expression_claim.sh"

echo
echo "8. Preview local"
if ! lsof -i :4321 >/dev/null 2>&1; then
  nohup pnpm preview >/tmp/aurora_preview.log 2>&1 &
  sleep 6
fi

curl -fsSL http://localhost:4321 > /tmp/aurora_local_vomega.html || fail "No responde preview local"
pass "Preview local responde"

echo
echo "9. Chequeos HTML local"
rg -q "AURORA" /tmp/aurora_local_vomega.html && pass "Wordmark AURORA presente en local" || fail "AURORA no aparece en local"
rg -q "SYSTEM ACTIVE" /tmp/aurora_local_vomega.html && pass "SYSTEM ACTIVE presente en local" || fail "SYSTEM ACTIVE no aparece en local"
if rg -q "Probás todo menos el plan|Probas todo menos el plan" /tmp/aurora_local_vomega.html; then
  pass "Hero visible en local"
else
  warn "Hero exacto no detectado en local; revisar minificación o copy"
fi

echo
echo "10. Deploy producción"
vercel --prod >/tmp/aurora_vercel_deploy.log 2>&1 || {
  cat /tmp/aurora_vercel_deploy.log
  fail "Falló vercel --prod"
}
pass "Deploy producción"

echo
echo "11. Verificación pública"
sleep 8
curl -fsSL "$PUBLIC_URL" > /tmp/aurora_public_vomega.html || fail "No responde producción"
pass "Producción responde"

if rg -q "AURORA" /tmp/aurora_public_vomega.html; then
  pass "AURORA visible en producción"
else
  fail "AURORA no visible en producción"
fi

if rg -q "SYSTEM ACTIVE" /tmp/aurora_public_vomega.html; then
  pass "SYSTEM ACTIVE visible en producción"
else
  warn "SYSTEM ACTIVE no visible en producción"
fi

if diff -q /tmp/aurora_local_vomega.html /tmp/aurora_public_vomega.html >/dev/null 2>&1; then
  pass "Local y producción coinciden"
else
  warn "Local y producción difieren. Puede haber minificación/cache/copy distinto."
fi

echo
echo "12. Estado git"
git status --short || true

echo
echo "========================================"
echo "GUARDRAIL vΩ COMPLETADO"
echo "URL pública:"
echo "$PUBLIC_URL"
echo "========================================"
