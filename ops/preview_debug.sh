#!/usr/bin/env bash
set -euo pipefail
PREVIEW_URL="${1:-}"
[[ -z "$PREVIEW_URL" ]] && { echo "Usage: $0 <preview-url>"; exit 1; }

echo "== HTTP codes =="
curl -sS -o /dev/null -w "HOME %{http_code}\n" "$PREVIEW_URL/"
curl -sS -o /dev/null -w "DEMO %{http_code}\n" "$PREVIEW_URL/demo"

echo "== Headers (HOME) =="
curl -sS -I "$PREVIEW_URL/" | head -20

echo "== vercel inspect =="
vercel inspect "$PREVIEW_URL" --json 2>/dev/null | head -50 || vercel inspect "$PREVIEW_URL" 2>&1 | head -30
