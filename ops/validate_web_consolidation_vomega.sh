#!/usr/bin/env bash
set -euo pipefail

RED=$'\e[31m'; GRN=$'\e[32m'; YLW=$'\e[33m'; CLR=$'\e[0m'
fail(){ echo "${RED}❌ $*${CLR}" >&2; exit 1; }
ok(){ echo "${GRN}✅ $*${CLR}"; }
warn(){ echo "${YLW}⚠️ $*${CLR}"; }

echo "== AURORA WEB vΩ VALIDATION =="

# 0) Repo + branch
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "No estás en un repo git"
echo "Repo: $ROOT"
BR="$(git rev-parse --abbrev-ref HEAD)"
echo "Branch: $BR"
[[ "$BR" == "main" ]] || warn "No estás en main (estás en $BR). Ojo si vas a deployar."

# 1) Guard existe y corre
[[ -x ops/ban_copy_guard.sh ]] || fail "ops/ban_copy_guard.sh no existe o no es ejecutable"
[[ -f ops/prohibited_strings.txt ]] || fail "ops/prohibited_strings.txt no existe"

OUT="$(./ops/ban_copy_guard.sh || true)"
echo "$OUT" | rg -q "✅ OK: no prohibited strings in executable surface" \
  || fail "ban_copy_guard no devolvió OK. Salida: $OUT"
ok "ban_copy_guard OK (sin falsos positivos, superficie ejecutable limpia)"

# 2) Strings prohibidos y zombies (superficie ejecutable)
rg -n "calibrar|Evaluación generada|Tiempo, costo, riesgo|Te ordena el problema" src >/dev/null \
  && fail "Encontré strings prohibidos en src" || ok "Sin strings prohibidos en src"

rg -n "legacy|omega|vomega|panel|card|grid-product" src >/dev/null \
  && fail "Encontré residuos zombie en src" || ok "Sin residuos zombie en src"

# 3) Build
pnpm -s build >/dev/null || fail "pnpm build falló"
ok "pnpm build OK"

# 4) PROD alignment (si existe el script)
if [[ -x ops/validate_prod_alignment.sh ]]; then
  ALIGN="$(./ops/validate_prod_alignment.sh || true)"
  echo "$ALIGN" | rg -q "✅ Producción alineada con main" || fail "Producción NO alineada con main. Salida: $ALIGN"
  ok "Producción alineada con main"
else
  warn "ops/validate_prod_alignment.sh no existe, salteo"
fi

# 5) PROD HTML: no debe contener banned copy (usa tu lista)
echo "Chequeando PROD HTML contra prohibited_strings.txt..."
HTML="$(curl -fsSL https://aurora-site-brown.vercel.app/ || true)"
[[ -n "$HTML" ]] || fail "No pude fetchear HTML de PROD"

BAD=0
while IFS= read -r s; do
  [[ -z "${s// }" ]] && continue
  if printf "%s" "$HTML" | rg -q -F "$s"; then
    echo "❌ En PROD aparece string prohibido: $s"
    BAD=1
  fi
done < ops/prohibited_strings.txt
[[ "$BAD" -eq 0 ]] || fail "PROD contiene strings prohibidos"
ok "PROD sin strings prohibidos"

# 6) Higiene git
STATUS="$(git status -sb)"
echo "$STATUS"
if echo "$STATUS" | rg -q " M "; then
  warn "Repo no está limpio (hay cambios sin commit). Recomendado: commit + push."
else
  ok "Repo limpio"
fi

ok "VALIDACIÓN vΩ COMPLETA"
