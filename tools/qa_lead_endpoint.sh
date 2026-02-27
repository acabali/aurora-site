#!/usr/bin/env bash
set -euo pipefail
set +H
unsetopt HIST_EXPAND 2>/dev/null || true

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${AURORA_QA_PORT:-4510}"
PREVIEW_URL="http://127.0.0.1:${PORT}"
PREVIEW_LOG="${ROOT}/tools/.qa_preview.log"

cleanup() {
  if [[ -n "${PREVIEW_PID:-}" ]]; then
    kill "${PREVIEW_PID}" 2>/dev/null || true
    wait "${PREVIEW_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "${ROOT}"
npm run build

start_server() {
  local mode="$1"
  : >"${PREVIEW_LOG}"
  if [[ "${mode}" == "preview" ]]; then
    npm run preview -- --host 127.0.0.1 --port "${PORT}" >"${PREVIEW_LOG}" 2>&1 &
  else
    vercel dev --listen "${PORT}" >"${PREVIEW_LOG}" 2>&1 &
  fi
  PREVIEW_PID=$!
}

wait_server() {
  for _ in {1..40}; do
    if curl -fsS "${PREVIEW_URL}/" >/dev/null 2>&1; then
      return 0
    fi
    if ! kill -0 "${PREVIEW_PID}" >/dev/null 2>&1; then
      return 1
    fi
    sleep 0.5
  done
  return 1
}

start_server "preview"
if ! wait_server; then
  kill "${PREVIEW_PID}" 2>/dev/null || true
  wait "${PREVIEW_PID}" 2>/dev/null || true
  start_server "vercel"
  wait_server
fi

PAYLOAD='{"session_id":"qa_local_session","name":"QA Local","company":"Aurora QA","country":"Argentina","industry":"Tecnología","email_domain":"aurora.test","source":"aurora-site"}'
RESPONSE="$(curl -fsS -X POST "${PREVIEW_URL}/api/lead" -H "Content-Type: application/json" --data "${PAYLOAD}")"
echo "${RESPONSE}"
echo "${RESPONSE}" | rg '"ok"[[:space:]]*:[[:space:]]*true' >/dev/null
