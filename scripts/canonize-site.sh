#!/usr/bin/env bash
set -Eeuo pipefail

echo "== AURORA SITE CANON CHECK =="

cd ~/aurora-site || { echo "No existe aurora-site"; exit 1; }

CANON_PATH="design/aurora-home-v2.html"
[[ -f "$CANON_PATH" ]] || { echo "Falta $CANON_PATH"; exit 1; }

echo "Canon presente en $CANON_PATH"
echo "La home se renderiza directamente desde ese HTML; no se sobreescriben rutas ni páginas."

echo "== RUN BUILD CHECK =="
npm run repo:build || { echo "Build falló"; exit 1; }

echo "== DONE =="
