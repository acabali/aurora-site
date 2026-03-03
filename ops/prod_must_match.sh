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
#!/usr/bin/env bash
set -euo pipefail

PROD_URL="${1:-https://aurora-site-brown.vercel.app}"
FORCE="${FORCE_DEPLOY:-0}"

say(){ printf "%s\n" "$*"; }
die(){ say "ABORT: $*"; exit 1; }

need(){ command -v "$1" >/dev/null 2>&1 || die "Falta comando: $1"; }
need git; need pnpm; need curl; need rg; need shasum

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || die "No estás dentro de un repo git"

say "== PRE-FLIGHT =="
git status -sb
pnpm -s build

# deps + narrativa congelada
if git diff --name-only -- package.json pnpm-lock.yaml | rg -q '.'; then
  die "Deps cambiaron (package.json/pnpm-lock.yaml). Prohibido."
fi
if git diff --name-only -- src/content/home.ts | rg -q '.'; then
  die "Narrativa tocada (src/content/home.ts). Prohibido."
fi

get_prod() {
  local url="$1"
  local home_code demo_code home_sha build
  home_code="$(curl -sS -o /dev/null -w "%{http_code}" "$url/")"
  demo_code="$(curl -sS -o /dev/null -w "%{http_code}" "$url/demo")"
  home_sha="$(curl -sS "$url/" | shasum -a 256 | awk '{print $1}')"
  build="$(curl -sS "$url/" | rg -o 'data-build="[^"]+"' -m 1 || true)"
  printf "%s %s %s %s\n" "$home_code" "$demo_code" "$home_sha" "${build:-data-build=MISSING}"
}

say "== PROD PRE =="
read -r PRE_HOME PRE_DEMO PRE_SHA PRE_BUILD < <(get_prod "$PROD_URL")
say "HOME $PRE_HOME"
say "DEMO $PRE_DEMO"
say "SHA  $PRE_SHA"
say "BUILD $PRE_BUILD"

[[ "$PRE_HOME" == "200" ]] || die "HOME no da 200 (pre)"
[[ "$PRE_DEMO" == "200" ]] || die "DEMO no da 200 (pre)"

say "== DEPLOY DECISION =="
HEAD_NOW="$(git rev-parse --short HEAD)"
UPSTREAM="$(git rev-parse --short @{u} 2>/dev/null || true)"
say "LOCAL_HEAD $HEAD_NOW"
say "UPSTREAM   ${UPSTREAM:-none}"

# Evita redeploy vacío si no hay commits nuevos vs upstream y no forzaste
if [[ -n "$UPSTREAM" && "$HEAD_NOW" == "$UPSTREAM" && "$FORCE" != "1" ]]; then
  say "SKIP deploy: main sin commits nuevos vs upstream. (FORCE_DEPLOY=1 para forzar)"
else
  say "Deploying prod..."
  vercel --prod --yes
fi

say "== PROD POST =="
read -r POST_HOME POST_DEMO POST_SHA POST_BUILD < <(get_prod "$PROD_URL")
say "HOME $POST_HOME"
say "DEMO $POST_DEMO"
say "SHA  $POST_SHA"
say "BUILD $POST_BUILD"

[[ "$POST_HOME" == "200" ]] || die "HOME no da 200 (post)"
[[ "$POST_DEMO" == "200" ]] || die "DEMO no da 200 (post)"

if [[ "$PRE_SHA" == "$POST_SHA" ]]; then
  die "SHA no cambió. Estás viendo el mismo HTML o no hubo cambio real en prod."
fi

if [[ "$POST_BUILD" == "data-build=MISSING" ]]; then
  die "No existe data-build en HTML. Falta el build marker."
fi

if [[ "$PRE_BUILD" == "$POST_BUILD" ]]; then
  die "Build marker no cambió. Alias/deploy no reflejó el commit nuevo."
fi

say "OK: SHA cambió ✅"
say "OK: build marker cambió ✅"
say "Reflejado en prod: SI"
