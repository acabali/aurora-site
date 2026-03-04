#!/usr/bin/env bash
set -euo pipefail

PROD_URL="${1:-https://aurora-site-brown.vercel.app/}"
NEW_URL="${2:-https://aurora-site-brown.vercel.app/}"
BASE_DIR="ops/visual"
BEFORE_RAW="${BASE_DIR}/prod-before.html"
AFTER_RAW="${BASE_DIR}/prod-after.html"
BEFORE_NORM="${BASE_DIR}/prod-before.norm.html"
AFTER_NORM="${BASE_DIR}/prod-after.norm.html"
DIFF_FILE="${BASE_DIR}/prod.diff"

mkdir -p "$BASE_DIR"

if [[ ! -s "$BEFORE_RAW" ]]; then
  curl -fsSL "$PROD_URL" > "$BEFORE_RAW"
fi

curl -fsSL "$NEW_URL" > "$AFTER_RAW"

normalize() {
  tr '>' '>\n' < "$1" \
    | sed 's/</\n</g' \
    | sed -E 's/ ([a-zA-Z_:][-a-zA-Z0-9_:.]*=)/\n\1/g' \
    | sed 's/^[[:space:]]\+//g' \
    | sed '/^$/d' > "$2"
}

normalize "$BEFORE_RAW" "$BEFORE_NORM"
normalize "$AFTER_RAW" "$AFTER_NORM"

diff -u "$BEFORE_NORM" "$AFTER_NORM" > "$DIFF_FILE" || true
DIFF_LINES="$(wc -l < "$DIFF_FILE" | tr -d ' ')"

printf "visual_gate: diff_lines=%s\n" "$DIFF_LINES"

if [[ "$DIFF_LINES" -lt 200 ]]; then
  echo "visual_gate: FAIL (diff < 200 lines)"
  exit 1
fi

echo "visual_gate: PASS"
