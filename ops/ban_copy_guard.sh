#!/usr/bin/env bash
set -euo pipefail
FILE="ops/prohibited_strings.txt"
[[ -f "$FILE" ]] || { echo "❌ Missing $FILE"; exit 1; }
FAIL=0
while IFS= read -r s; do
  [[ -z "${s// }" ]] && continue
  if rg -n --hidden --no-ignore-vcs -F "$s" .; then
    echo "❌ PROHIBITED STRING DETECTED: $s"
    FAIL=1
  fi
done < "$FILE"
[[ "$FAIL" -eq 0 ]] && echo "✅ OK: no prohibited strings"
exit "$FAIL"
