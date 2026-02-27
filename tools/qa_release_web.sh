#!/usr/bin/env bash
set -euo pipefail
set +H
unsetopt HIST_EXPAND 2>/dev/null || true

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${AURORA_QA_PORT:-4510}"
LOCAL_URL="http://127.0.0.1:${PORT}"
PROD_URL="${AURORA_PROD_URL:-https://aurora-site-brown.vercel.app}"
MARKERS_REGEX='demo-root|name="email"|aurora_demo_executed|Analizando interacción'
PAYLOAD='{"session_id":"prod_qa","name":"QA","company":"Aurora","country":"AR","industry":"Tech","email_domain":"aurora.test","source":"aurora-site"}'
SERVER_LOG="$(mktemp -t aurora-qa-server.XXXXXX.log)"
HOME_HTML="$(mktemp -t aurora-qa-home.XXXXXX.html)"

PREVIEW_PID=""

log() {
  printf "[qa] %s\n" "$*"
}

fail() {
  printf "[qa] FAIL: %s\n" "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "${PREVIEW_PID}" ]]; then
    kill "${PREVIEW_PID}" 2>/dev/null || true
    wait "${PREVIEW_PID}" 2>/dev/null || true
  fi
  rm -f "${HOME_HTML}" "${SERVER_LOG}"
}
trap cleanup EXIT

wait_http_ok() {
  local url="$1"
  local retries=50
  for _ in $(seq 1 "${retries}"); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.4
  done
  return 1
}

assert_port_free() {
  if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "puerto ${PORT} ocupado; liberalo o seteá AURORA_QA_PORT"
  fi
}

start_server() {
  local mode="$1"
  : >"${SERVER_LOG}"
  case "${mode}" in
    preview)
      npm run preview -- --host 127.0.0.1 --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
      ;;
    dev)
      npm run dev -- --host 127.0.0.1 --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
      ;;
    *)
      fail "modo de server no soportado: ${mode}"
      ;;
  esac
  PREVIEW_PID=$!
}

assert_status_200() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${url}")"
  [[ "${code}" == "200" ]] || fail "esperaba 200 en ${url}, recibí ${code}"
  log "200 OK ${url}"
}

cd "${ROOT}"
assert_port_free

if [[ -f package-lock.json ]]; then
  log "Instalando dependencias con npm ci"
  npm ci
else
  log "Instalando dependencias con npm install"
  npm install
fi

log "Build de producción"
npm run build

log "Intentando levantar preview local en ${LOCAL_URL}"
start_server "preview"
if ! wait_http_ok "${LOCAL_URL}/"; then
  log "preview no disponible con @astrojs/vercel, fallback a npm run dev"
  kill "${PREVIEW_PID}" 2>/dev/null || true
  wait "${PREVIEW_PID}" 2>/dev/null || true
  PREVIEW_PID=""
  start_server "dev"
  wait_http_ok "${LOCAL_URL}/" || fail "no pude levantar server local; revisar ${SERVER_LOG}"
fi

assert_status_200 "${LOCAL_URL}/"
assert_status_200 "${LOCAL_URL}/demo"

curl -fsS "${LOCAL_URL}/" > "${HOME_HTML}"
if rg -n "${MARKERS_REGEX}" "${HOME_HTML}" >/dev/null; then
  fail "la home contiene markup o textos de demo"
fi
log "Home limpia: sin demo markup"

local_lead_status=0
local_lead_body=""
if local_lead_body="$(curl -sS -X POST "${LOCAL_URL}/api/lead" -H "Content-Type: application/json" --data "${PAYLOAD}")"; then
  if echo "${local_lead_body}" | rg -q '"ok"[[:space:]]*:[[:space:]]*true'; then
    log "Lead local OK"
    local_lead_status=1
  fi
fi

if [[ "${local_lead_status}" -eq 0 ]]; then
  log "Lead local no configurable en este entorno; validando en prod"
  prod_lead_body="$(curl -fsS -X POST "${PROD_URL}/api/lead" -H "Content-Type: application/json" --data "${PAYLOAD}")"
  echo "${prod_lead_body}" | rg -q '"ok"[[:space:]]*:[[:space:]]*true' || fail "prod /api/lead no devolvió ok:true"
  log "Lead prod OK"
fi

prod_code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${PROD_URL}/api/lead" -H "Content-Type: application/json" --data "${PAYLOAD}")"
[[ "${prod_code}" == "200" ]] || fail "esperaba 200 en prod /api/lead, recibí ${prod_code}"
log "Headers/status prod /api/lead OK"

log "QA release web completo"
