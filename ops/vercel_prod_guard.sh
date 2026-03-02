#!/usr/bin/env bash
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$BRANCH" != "main" ]]; then
  echo "❌ ABORTADO: producción solo desde main"
  echo "Branch actual: $BRANCH"
  exit 1
fi

echo "✅ Branch validado: main"
vercel --prod --yes
