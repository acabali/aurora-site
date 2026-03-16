#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="http://127.0.0.1:4321"
SCREENSHOT_PATH="$ROOT_DIR/aurora_visual_audit.png"
LOG_PATH="$ROOT_DIR/.visual-audit-preview.log"

cd "$ROOT_DIR"

cleanup() {
  if [[ -n "${PREVIEW_PID:-}" ]] && kill -0 "$PREVIEW_PID" >/dev/null 2>&1; then
    kill "$PREVIEW_PID" >/dev/null 2>&1 || true
    wait "$PREVIEW_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "Building site..."
pnpm build

echo "Starting local preview..."
pnpm exec astro preview --host 127.0.0.1 --port 4321 >"$LOG_PATH" 2>&1 &
PREVIEW_PID=$!

for _ in {1..30}; do
  if curl -sSf "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sSf "$URL" >/dev/null 2>&1; then
  echo "Preview server did not become ready."
  echo "Preview log:"
  cat "$LOG_PATH"
  exit 1
fi

echo "Ensuring Playwright Chromium is installed..."
npx playwright install chromium >/dev/null

echo "Capturing screenshot..."
npx playwright screenshot "$URL" "$SCREENSHOT_PATH"

echo "Screenshot saved:"
echo "$SCREENSHOT_PATH"
