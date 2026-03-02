#!/usr/bin/env bash
set -euo pipefail

TARGET="src/content/home.ts"

unstaged="$(git diff --name-only -- "$TARGET")"
staged="$(git diff --cached --name-only -- "$TARGET")"

if [[ -n "$unstaged" || -n "$staged" ]]; then
  echo "❌ FAIL: $TARGET was modified."
  [[ -n "$unstaged" ]] && echo "   unstaged: $unstaged"
  [[ -n "$staged" ]] && echo "   staged: $staged"
  exit 1
fi

echo "✅ OK: $TARGET is immutable in this run"
