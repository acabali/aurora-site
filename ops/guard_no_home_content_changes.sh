#!/usr/bin/env bash
set -euo pipefail
git diff --name-only origin/main...HEAD | rg -q '^src/content/home\.ts$' && { echo "ABORT: home.ts modificado"; exit 1; } || true
