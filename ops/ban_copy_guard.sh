#!/usr/bin/env bash
set -euo pipefail

FILE="ops/prohibited_strings.txt"
[[ -f "$FILE" ]] || { echo "❌ Missing $FILE"; exit 1; }

FAIL=0

while IFS= read -r s; do
  [[ -z "${s// }" ]] && continue

  if rg -n -F "$s" src public; then
    echo "❌ PROHIBITED STRING DETECTED IN EXECUTABLE CODE: $s"
    FAIL=1
  fi
done < "$FILE"

if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ OK: no prohibited strings in executable surface"
fi

exit "$FAIL"
