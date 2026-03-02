#!/usr/bin/env bash
set -euo pipefail

forbidden_regex='^(node_modules/|dist/|\.vercel/|\.astro/|coverage/|playwright-report/|test-results/|\.pnpm-store/|\.playwright-cli/)'

tracked_forbidden="$(git ls-files | rg "$forbidden_regex" || true)"
if [[ -n "$tracked_forbidden" ]]; then
  echo "❌ FAIL: forbidden tracked artifacts detected:"
  echo "$tracked_forbidden"
  exit 1
fi

echo "Top 20 tracked files by size (bytes):"
git ls-files -z \
  | xargs -0 -I{} bash -lc 's=$(wc -c < "$1" 2>/dev/null || echo 0); echo "$s $1"' _ "{}" \
  | sort -nr \
  | head -n 20

largest_bytes="$(git ls-files -z | xargs -0 -I{} bash -lc 'wc -c < "$1" 2>/dev/null || echo 0' _ "{}" | sort -nr | head -n 1)"
if [[ "${largest_bytes:-0}" -gt 25000000 ]]; then
  echo "❌ FAIL: suspiciously large tracked file detected (${largest_bytes} bytes > 25000000)"
  exit 1
fi

echo "✅ OK: repo hygiene check passed"
