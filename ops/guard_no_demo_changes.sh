#!/usr/bin/env bash
set -euo pipefail
if git diff --name-only origin/main...HEAD | rg -q '^src/pages/demo\.astro$'; then
  echo "ABORT: demo.astro fue modificado (regla: NO tocar demo)"
  exit 1
fi
