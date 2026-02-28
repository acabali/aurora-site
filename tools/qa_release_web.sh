#!/usr/bin/env bash
set -euo pipefail
set +H
unsetopt HIST_EXPAND 2>/dev/null || true

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${AURORA_QA_PORT:-4510}"
LOCAL_URL="http://127.0.0.1:${PORT}"
PROD_URL="${AURORA_PROD_URL:-https://aurora-site-brown.vercel.app}"
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

assert_port_free() {
  if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "puerto ${PORT} ocupado; liberalo o seteá AURORA_QA_PORT"
  fi
}

wait_http_ok() {
  local url="$1"
  for _ in $(seq 1 60); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.4
  done
  return 1
}

start_server() {
  local mode="$1"
  : >"${SERVER_LOG}"
  case "${mode}" in
    preview)
      AURORA_LEAD_DRY_RUN=1 npm run preview -- --host 127.0.0.1 --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
      ;;
    dev)
      AURORA_LEAD_DRY_RUN=1 npm run dev -- --host 127.0.0.1 --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
      ;;
    *)
      fail "modo de server no soportado: ${mode}"
      ;;
  esac
  PREVIEW_PID=$!
}

assert_get_200() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${url}")"
  [[ "${code}" == "200" ]] || fail "esperaba GET 200 en ${url}, recibí ${code}"
  log "GET 200 ${url}"
}

assert_head_200() {
  local url="$1"
  local code
  code="$(curl -sS -I -o /dev/null -w "%{http_code}" "${url}")"
  [[ "${code}" == "200" ]] || fail "esperaba HEAD 200 en ${url}, recibí ${code}"
  log "HEAD 200 ${url}"
}

assert_lead_ok() {
  local url="$1"
  local body
  body="$(curl -fsS -X POST "${url}" -H "Content-Type: application/json" --data "${PAYLOAD}")"
  echo "${body}" | rg -q '"ok"[[:space:]]*:[[:space:]]*true' || fail "${url} no devolvió ok:true"
  log "POST ok:true ${url}"
}

assert_get_405() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${url}")"
  [[ "${code}" == "405" ]] || fail "esperaba GET 405 en ${url}, recibí ${code}"
  log "GET 405 ${url}"
}

assert_cache_control() {
  local url="$1"
  local header
  header="$(curl -sS -I "${url}" | tr -d "\r" | awk -F': ' 'tolower($1)=="cache-control"{print $2}' | tail -n1)"
  [[ -n "${header}" ]] || fail "cache-control ausente en ${url}"
  if ! echo "${header}" | rg -qi 'max-age=0|no-store|must-revalidate'; then
    fail "cache-control no válido en ${url}: ${header}"
  fi
  log "cache-control OK ${url}: ${header}"
}

assert_home_contains() {
  local html="$1"
  local text="$2"
  echo "${html}" | rg -Fq "${text}" || fail "home no contiene: ${text}"
}

assert_home_not_contains_demo_markup() {
  local html_file="$1"
  if rg -n 'demo-root|aurora_demo_executed|Analizando interacción|name="email"' "${html_file}" >/dev/null; then
    fail "home contiene markup/textos de demo"
  fi
  log "home sin markup de demo"
}

cd "${ROOT}"
assert_port_free

if [[ -f package-lock.json ]]; then
  log "npm ci"
  npm ci
else
  log "npm install"
  npm install
fi

log "npm run build"
npm run build

log "levantando server local (${LOCAL_URL})"
start_server "preview"
if ! wait_http_ok "${LOCAL_URL}/"; then
  log "preview no disponible, fallback a dev"
  kill "${PREVIEW_PID}" 2>/dev/null || true
  wait "${PREVIEW_PID}" 2>/dev/null || true
  PREVIEW_PID=""
  start_server "dev"
  wait_http_ok "${LOCAL_URL}/" || fail "no pude levantar server local; revisar ${SERVER_LOG}"
fi

assert_get_200 "${LOCAL_URL}/"
assert_get_200 "${LOCAL_URL}/demo"

curl -fsS "${LOCAL_URL}/" > "${HOME_HTML}"
HOME_CONTENT="$(cat "${HOME_HTML}")"
assert_home_contains "${HOME_CONTENT}" "Las variables crecieron."
assert_home_contains "${HOME_CONTENT}" "Operar igual ya no alcanza."
assert_home_contains "${HOME_CONTENT}" "Aurora calibra decisiones bajo el estándar actual."
assert_home_contains "${HOME_CONTENT}" "href=\"/demo\""
assert_home_not_contains_demo_markup "${HOME_HTML}"

assert_lead_ok "${LOCAL_URL}/api/lead"
assert_get_405 "${LOCAL_URL}/api/lead"

assert_head_200 "${PROD_URL}/"
assert_head_200 "${PROD_URL}/demo"
assert_cache_control "${PROD_URL}/"
assert_cache_control "${PROD_URL}/demo"
assert_lead_ok "${PROD_URL}/api/lead"
assert_get_405 "${PROD_URL}/api/lead"

printf "QA release web completo\n"
