#!/usr/bin/env bash
# Content Truth Gate — ROOT FIX PROTOCOL vΩ
# Valida contenido real servido en producción.
set -euo pipefail
PROD="${1:-https://aurora-site-brown.vercel.app}"
HTML=$(curl -fsSL "$PROD/")

echo "== LOCAL HEAD =="
git rev-parse HEAD

echo "== PROD HTTP =="
curl -sS -o /dev/null -w "HOME %{http_code}\n" "$PROD/"
curl -sS -o /dev/null -w "DEMO %{http_code}\n" "$PROD/demo"

echo "== PROD data-build =="
echo "$HTML" | rg -o 'data-build="[^"]+"' | head -n 1

echo "== CONTENT TRUTH GATE — Frases obligatorias (10) =="
REQUIRED=(
  "El límite humano ya no alcanza"
  "Compite con sistemas"
  "Aurora no mejora decisiones"
  "cálculo permanente"
  "La forma de operar cambió"
  "Es condición de entrada"
  "Es desventaja"
  "El mercado premia cálculo"
  "Penaliza interpretación"
  "Aurora no opina"
)
MISSING=0
for phrase in "${REQUIRED[@]}"; do
  if echo "$HTML" | rg -qF "$phrase"; then
    echo "OK: $phrase"
  else
    echo "MISSING: $phrase"
    MISSING=$((MISSING + 1))
  fi
done

echo "== CONTENT TRUTH GATE — Strings prohibidos (0) =="
PROHIBITED=$(echo "$HTML" | rg -n "5:|13:|07 DEMO CTA" || true)
if [ -n "$PROHIBITED" ]; then
  echo "ABORT: tokens prohibidos encontrados:"
  echo "$PROHIBITED"
  exit 1
fi
echo "OK: 0 matches prohibidos"

echo "== PROD blocks =="
echo "$HTML" | rg "ACCESO" && { echo "ABORT: ACCESO"; exit 1; } || echo "OK: sin ACCESO"

if [ "$MISSING" -gt 0 ]; then
  echo "ABORT: $MISSING frases obligatorias faltantes"
  exit 1
fi

echo "== PROD SHA =="
echo "$HTML" | shasum -a 256

echo "== GATE PASSED =="
