#!/usr/bin/env bash
set -euo pipefail
git diff --name-only origin/main...HEAD | rg -q '^(package\.json|pnpm-lock\.yaml)$' && { echo "ABORT: deps tocadas"; exit 1; } || true
