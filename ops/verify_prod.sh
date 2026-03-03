#!/usr/bin/env bash
set -euo pipefail
PROD="${1:-https://aurora-site-brown.vercel.app}"

echo "== LOCAL HEAD =="
git rev-parse HEAD

echo "== PROD HTTP =="
curl -sS -o /dev/null -w "HOME %{http_code}\n" "$PROD/"
curl -sS -o /dev/null -w "DEMO %{http_code}\n" "$PROD/demo"

echo "== PROD data-build =="
curl -fsSL "$PROD/" | rg -o 'data-build="[^"]+"' | head -n 1

echo "== PROD narrative =="
curl -fsSL "$PROD/" | rg "El límite humano ya no alcanza" >/dev/null && echo "OK: narrativa"

echo "== PROD blocks =="
curl -fsSL "$PROD/" | rg "ACCESO" && { echo "ABORT: ACCESO"; exit 1; } || echo "OK: sin ACCESO"

echo "== PROD SHA =="
curl -fsSL "$PROD/" | shasum -a 256
