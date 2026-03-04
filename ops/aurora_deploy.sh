#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/aurora-site"
ALIAS="https://aurora-site-brown.vercel.app"

cd "$REPO" || { echo "Repo no encontrado"; exit 1; }

echo
echo "===================================="
echo "AURORA DEPLOY SENTINEL vΩ"
echo "===================================="

# -----------------------------------
# 1 Repo limpio
# -----------------------------------

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ ERROR: repo tiene cambios sin commit"
  git status
  exit 1
fi

echo "✔ repo limpio"

# -----------------------------------
# 2 Branch correcta
# -----------------------------------

branch=$(git rev-parse --abbrev-ref HEAD)

if [[ "$branch" != "main" ]]; then
  echo "❌ deploy solo permitido desde main"
  exit 1
fi

echo "✔ branch main"

# -----------------------------------
# 3 Commit actual
# -----------------------------------

HEAD=$(git rev-parse HEAD)

echo
echo "HEAD commit:"
echo "$HEAD"

# -----------------------------------
# 4 Build limpio
# -----------------------------------

echo
echo "== CLEAN BUILD =="

rm -rf .astro dist

pnpm build

echo "✔ build OK"

# -----------------------------------
# 5 Push repo
# -----------------------------------

echo
echo "== PUSH =="

git push origin main

echo "✔ push OK"

# -----------------------------------
# 6 Deploy Vercel
# -----------------------------------

echo
echo "== DEPLOY VERCEL =="

vercel --prod --force

echo "✔ deploy enviado"

# -----------------------------------
# 7 Esperar propagación CDN
# -----------------------------------

echo
echo "esperando propagación CDN..."

sleep 6

# -----------------------------------
# 8 Obtener HTML producción
# -----------------------------------

HTML=$(curl -fsSL "$ALIAS")

# -----------------------------------
# 9 Validar commit desplegado
# -----------------------------------

BUILD=$(echo "$HTML" | rg -o 'data-build="[^"]+"' | head -n1 | sed 's/data-build="//' | sed 's/"//')

echo
echo "prod build:"
echo "$BUILD"

if [[ "$BUILD" != "$HEAD"* ]]; then
  echo
  echo "❌ DEPLOY DESALINEADO"
  echo "HEAD: $HEAD"
  echo "PROD: $BUILD"
  exit 1
fi

echo "✔ build sincronizado"

# -----------------------------------
# 10 Verificación UI crítica
# -----------------------------------

echo
echo "== UI CHECK =="

echo "$HTML" | rg "SYSTEM MODULES" >/dev/null || { echo "❌ marker faltante"; exit 1; }

echo "$HTML" | rg "ADVANCED CAPABILITIES" >/dev/null || { echo "❌ marker faltante"; exit 1; }

echo "✔ UI markers OK"

# -----------------------------------
# 11 Comparación HTML local vs prod
# -----------------------------------

echo
echo "== LOCAL VS PROD CHECK =="

LOCAL_HTML=$(curl -fsSL http://localhost:4321 || true)

if [[ -n "$LOCAL_HTML" ]]; then

LOCAL_HASH=$(echo "$LOCAL_HTML" | shasum | awk '{print $1}')
PROD_HASH=$(echo "$HTML" | shasum | awk '{print $1}')

echo "local hash: $LOCAL_HASH"
echo "prod  hash: $PROD_HASH"

else

echo "local dev server no activo (skip)"

fi

# -----------------------------------
# 12 Estado Vercel
# -----------------------------------

echo
echo "== VERCEL DEPLOYMENTS =="

vercel ls | head -n 10

# -----------------------------------
# 13 Resultado final
# -----------------------------------

echo
echo "===================================="
echo "✅ AURORA DEPLOY PASS"
echo "===================================="
