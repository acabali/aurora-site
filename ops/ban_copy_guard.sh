#!/usr/bin/env bash
set -euo pipefail
BAN='Antes hacían falta equipos, consultoras y meses'
if rg -n --hidden --no-ignore-vcs "$BAN" .; then
  echo "❌ COPY BANNED DETECTED: $BAN"
  exit 1
fi
echo "✅ OK: banned copy not found"
