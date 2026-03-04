#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/aurora-site"
ALIAS="https://aurora-site-brown.vercel.app"
PORT="${PORT:-4321}"

cd "$REPO" || exit 1

ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
bust="$(date +%s)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "== AURORA ROOT AUDIT vΩ =="
echo "ts: $ts"
echo

echo "== 0) CONTEXTO GIT =="
pwd
git remote -v
echo "branch: $(git rev-parse --abbrev-ref HEAD)"
echo "HEAD:   $(git rev-parse HEAD)"
echo "main:   $(git rev-parse main 2>/dev/null || true)"
echo "origin/main: $(git rev-parse origin/main 2>/dev/null || true)"
echo

echo "== 1) REGLA: DEMO INMUTABLE (solo chequeo) =="
if git show --name-only --pretty="" HEAD | rg -n 'src/pages/demo\.astro|/demo|Demo\.astro' >/dev/null; then
  echo "ALERTA: el último commit toca DEMO. ABORT por regla."
  git show --name-only --pretty="" HEAD | rg -n 'src/pages/demo\.astro|/demo|Demo\.astro' || true
  exit 9
else
  echo "OK: DEMO intacto en HEAD"
fi
echo

echo "== 2) BUILD LOCAL (sin deploy) =="
pnpm -s build >/dev/null
echo "OK: pnpm build"
echo

echo "== 3) CAPTURA HTML LOCAL vs PROD (ALIAS) =="
LOCAL_URL="http://localhost:${PORT}/?bust=${bust}"
PROD_URL="${ALIAS}/?bust=${bust}"

echo "Local URL esperado: $LOCAL_URL"
echo "Prod  URL esperado: $PROD_URL"
echo

echo "== 3A) PROD: headers críticos =="
curl -fsSI "$PROD_URL" | rg -n 'HTTP/|server:|x-vercel-id|cache-control|age:|content-type' || true
echo

echo "== 3B) PROD: data-build y marcadores clave =="
curl -fsSL "$PROD_URL" > "$tmp/prod.html"
PROD_BUILD="$(rg -n 'data-build="[^"]+"' -o "$tmp/prod.html" | head -n1 || true)"
echo "prod data-build: ${PROD_BUILD:-MISSING}"

echo "--- prod markers ---"
for s in \
  "MÓDULOS DEL SISTEMA" \
  "CAPACIDADES AVANZADAS" \
  "Productos"
do
  if rg -n --fixed-strings "$s" "$tmp/prod.html" >/dev/null; then
    echo "OK: marker '$s' presente"
  else
    echo "MISS: marker '$s' NO presente"
  fi
done
echo

echo "== 3C) LOCAL: data-build y marcadores (si server está levantado) =="
if curl -fsSL "$LOCAL_URL" > "$tmp/local.html" 2>/dev/null; then
  LOCAL_BUILD="$(rg -n 'data-build="[^"]+"' -o "$tmp/local.html" | head -n1 || true)"
  echo "local data-build: ${LOCAL_BUILD:-MISSING}"
  echo "--- local markers ---"
  for s in \
    "MÓDULOS DEL SISTEMA" \
    "CAPACIDADES AVANZADAS" \
    "Productos"
  do
    if rg -n --fixed-strings "$s" "$tmp/local.html" >/dev/null; then
      echo "OK: marker '$s' presente"
    else
      echo "MISS: marker '$s' NO presente"
    fi
  done
else
  echo "SKIP: no pude leer local ($LOCAL_URL). Asegurate de tener pnpm dev en $PORT."
fi
echo

echo "== 4) ASSETS: extraer _astro CSS/JS en PROD y hashearlos =="
rg -o '/_astro/[^"]+\.(css|js)' "$tmp/prod.html" | sort -u > "$tmp/prod_assets.txt" || true
echo "prod assets count: $(wc -l < "$tmp/prod_assets.txt" | tr -d ' ')"
echo

hash_url () {
  local url="$1"
  curl -fsSL "$url" | shasum -a 256 | awk '{print $1}'
}

n=0
while read -r path; do
  [[ -z "$path" ]] && continue
  n=$((n+1))
  [[ "$n" -gt 25 ]] && break
  full="${ALIAS}${path}?bust=${bust}"
  h="$(hash_url "$full" || echo "FAIL")"
  printf "PROD  %-60s %s\n" "$(basename "$path")" "$h"
done < "$tmp/prod_assets.txt"
echo

echo "== 5) ASSETS: hashear dist/client/_astro local =="
if [[ -d dist/client/_astro ]]; then
  find dist/client/_astro -maxdepth 1 -type f \( -name "*.css" -o -name "*.js" \) -print0 \
    | xargs -0 shasum -a 256 \
    | awk '{print "LOCAL " $2 " " $1}' \
    | sed "s#LOCAL dist/client/_astro/#LOCAL #g" \
    | head -n 40
else
  echo "MISS: no existe dist/client/_astro"
fi
echo

echo "== 6) VEREDICTO AUTOMÁTICO =="
HEAD="$(git rev-parse HEAD)"
if [[ "${PROD_BUILD:-}" != *"$HEAD"* ]]; then
  echo "VEREDICTO: ALIAS NO está sirviendo tu HEAD."
else
  echo "OK: alias sirve tu HEAD."
  echo "Si vos lo ves igual: cache del navegador o extensión."
fi

echo
echo "DONE."
