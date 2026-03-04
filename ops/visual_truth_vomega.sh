#!/usr/bin/env bash
set -euo pipefail
REPO="$HOME/aurora-site"
ALIAS="${ALIAS:-https://aurora-site-brown.vercel.app}"
PORT="${PORT:-4321}"
bust="$(date +%s)"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cd "$REPO" || exit 1
HEAD="$(git rev-parse HEAD)"

echo "== AURORA VISUAL TRUTH vΩ =="
echo "ts: $ts"
echo "HEAD: $HEAD"
echo

markers=(
"El límite humano ya no alcanza."
"Poner una decisión bajo evidencia"
"QUÉ CAMBIÓ"
"DESAJUSTE"
"RUPTURA"
"QUÉ ES AURORA"
"Pon tu próximo movimiento bajo evidencia."
"MÓDULOS DEL SISTEMA"
"CAPACIDADES AVANZADAS"
)

echo "== 1) PROD: data-build y markers duros =="
html="$(curl -fsSL "${ALIAS}/?bust=${bust}")"
echo "$html" | rg -n 'data-build="[^"]+"' -o | head -n1 || true
for s in "${markers[@]}"; do
  if printf "%s" "$html" | rg -n --fixed-strings "$s" >/dev/null; then
    echo "OK marker: $s"
  else
    echo "MISS marker: $s"
  fi
done
echo

echo "== 2) LOCAL: markers (requiere dev en :${PORT}) =="
if curl -fsSL "http://localhost:${PORT}/?bust=${bust}" > /tmp/aurora_local.html 2>/dev/null; then
  rg -n 'data-build="[^"]+"' -o /tmp/aurora_local.html | head -n1 || true
  for s in "${markers[@]}"; do
    if rg -n --fixed-strings "$s" /tmp/aurora_local.html >/dev/null; then
      echo "OK marker: $s"
    else
      echo "MISS marker: $s"
    fi
  done
else
  echo "SKIP: no local dev en :${PORT}"
fi
echo

echo "== 3) VEREDICTO =="
if printf "%s" "$html" | rg -n --fixed-strings "data-build=\"$HEAD\"" >/dev/null; then
  echo "OK: PROD sirve tu HEAD."
else
  echo "FAIL: PROD NO sirve tu HEAD. Alias/proyecto/deploy cruzado."
  exit 7
fi
echo "DONE"
