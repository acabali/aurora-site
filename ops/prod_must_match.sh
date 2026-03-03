#!/usr/bin/env bash
set -euo pipefail

FORCE=0
if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

ROOT_DIR="${HOME}/aurora-site"
PROD_URL="https://aurora-site-brown.vercel.app"
HOME_URL="${PROD_URL}/"
DEMO_URL="${PROD_URL}/demo"

capture_snapshot() {
  local prefix="$1"
  local home_file
  home_file="$(mktemp)"

  local home_code demo_code home_sha marker raw_marker
  home_code="$(curl -sS -o /dev/null -w "%{http_code}" "${HOME_URL}")"
  demo_code="$(curl -sS -o /dev/null -w "%{http_code}" "${DEMO_URL}")"
  curl -sS "${HOME_URL}" >"${home_file}"
  home_sha="$(shasum -a 256 "${home_file}" | awk '{print $1}')"
  raw_marker="$(rg -o --no-filename 'data-build="[^"]+"' "${home_file}" -m 1 || true)"
  marker="${raw_marker#data-build=\"}"
  marker="${marker%\"}"
  rm -f "${home_file}"

  printf -v "${prefix}_HOME_CODE" "%s" "${home_code}"
  printf -v "${prefix}_DEMO_CODE" "%s" "${demo_code}"
  printf -v "${prefix}_HOME_SHA" "%s" "${home_sha}"
  printf -v "${prefix}_BUILD_MARKER" "%s" "${marker}"
}

echo "== PRE-FLIGHT =="
cd "${ROOT_DIR}"
git status -sb
pnpm -s build

if [[ -n "$(git diff -- package.json pnpm-lock.yaml)" ]]; then
  echo "ABORT: package.json/pnpm-lock.yaml changed."
  echo "Reflejado en prod: NO"
  exit 1
fi

if [[ -n "$(git diff -- src/content/home.ts)" ]]; then
  echo "ABORT: src/content/home.ts changed."
  echo "Reflejado en prod: NO"
  exit 1
fi

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]]; then
  echo "ABORT: run this script from main branch."
  echo "Reflejado en prod: NO"
  exit 1
fi

echo "== PRE-PROD SNAPSHOT =="
capture_snapshot PRE
echo "HOME ${PRE_HOME_CODE}"
echo "DEMO ${PRE_DEMO_CODE}"
echo "SHA ${PRE_HOME_SHA}"
echo "BUILD data-build=\"${PRE_BUILD_MARKER:-MISSING}\""

MAIN_HEAD="$(git rev-parse HEAD)"
if [[ "${FORCE}" -eq 0 && "${PRE_BUILD_MARKER}" == "${MAIN_HEAD}" ]]; then
  echo "ABORT: main HEAD already deployed (${MAIN_HEAD}). Use --force to redeploy."
  echo "Reflejado en prod: NO"
  exit 1
fi

echo "== DEPLOY PROD =="
vercel --prod --yes

echo "== POST-PROD SNAPSHOT =="
capture_snapshot POST
echo "HOME ${POST_HOME_CODE}"
echo "DEMO ${POST_DEMO_CODE}"
echo "SHA ${POST_HOME_SHA}"
echo "BUILD data-build=\"${POST_BUILD_MARKER:-MISSING}\""

FAIL=0
if [[ "${POST_HOME_CODE}" != "200" || "${POST_DEMO_CODE}" != "200" ]]; then
  echo "FAIL: HTTP code mismatch (HOME=${POST_HOME_CODE}, DEMO=${POST_DEMO_CODE})"
  FAIL=1
fi

if [[ "${POST_HOME_SHA}" == "${PRE_HOME_SHA}" ]]; then
  echo "FAIL: HOME SHA did not change."
  FAIL=1
fi

if [[ -z "${PRE_BUILD_MARKER}" || -z "${POST_BUILD_MARKER}" || "${PRE_BUILD_MARKER}" == "${POST_BUILD_MARKER}" ]]; then
  echo "FAIL: build marker missing or unchanged."
  FAIL=1
fi

echo "== SUMMARY =="
echo "PRE HOME ${PRE_HOME_CODE} | PRE DEMO ${PRE_DEMO_CODE}"
echo "PRE SHA ${PRE_HOME_SHA}"
echo "PRE MARKER ${PRE_BUILD_MARKER:-<missing>}"
echo "POST HOME ${POST_HOME_CODE} | POST DEMO ${POST_DEMO_CODE}"
echo "POST SHA ${POST_HOME_SHA}"
echo "POST MARKER ${POST_BUILD_MARKER:-<missing>}"

if [[ "${FAIL}" -ne 0 ]]; then
  echo "Reflejado en prod: NO"
  exit 1
fi

echo "Reflejado en prod: SI"
