#!/usr/bin/env bash
set -euo pipefail

URL="https://aurora-site-brown.vercel.app"

echo "== WEB SMOKE TEST =="

HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
echo "HTTP $HTTP"

curl -fsSL "$URL" | grep data-aurora-canvas >/dev/null && echo "canvas OK" || echo "canvas FAIL"

curl -fsSL "$URL" | grep aurora-field >/dev/null && echo "field OK" || echo "field FAIL"

echo "SMOKE DONE"
