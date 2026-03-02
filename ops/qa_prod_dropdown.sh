#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://aurora-site-brown.vercel.app}"
TMP_HTML="$(mktemp)"
trap 'rm -f "$TMP_HTML"' EXIT

echo "== QA PROD dropdown deterministic checks =="
echo "BASE=$BASE"

curl -fsSL "$BASE/" > "$TMP_HTML"

rg -n 'id="site-products-trigger"' "$TMP_HTML" >/dev/null || {
  echo "❌ FAIL: #site-products-trigger not found in prod HTML"
  exit 1
}
rg -n 'id="site-products-menu"' "$TMP_HTML" >/dev/null || {
  echo "❌ FAIL: #site-products-menu not found in prod HTML"
  exit 1
}
rg -n '<script[^>]*type="module"[^>]*src="/_astro/[^"]+"' "$TMP_HTML" >/dev/null || {
  echo "❌ FAIL: module bundle tag /_astro/... not found in prod HTML"
  exit 1
}

SOURCE="src/layouts/PageLayout.astro"
[[ -f "$SOURCE" ]] || {
  echo "❌ FAIL: missing source $SOURCE"
  exit 1
}

rg -n '__auroraNavInit' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing global nav init guard in $SOURCE"
  exit 1
}
rg -n 'getElementById\("site-products-trigger"\)' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing trigger query by ID in $SOURCE"
  exit 1
}
rg -n 'getElementById\("site-products-menu"\)' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing menu query by ID in $SOURCE"
  exit 1
}
rg -n 'addEventListener\("click"' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing click handler binding in $SOURCE"
  exit 1
}
rg -n 'menu\.hidden = !nextOpen' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing menu.hidden toggle in $SOURCE"
  exit 1
}
rg -n 'menu\.style\.display = nextOpen \? "" : "none"' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing menu display toggle in $SOURCE"
  exit 1
}
rg -n 'setAttribute\("aria-expanded", nextOpen \? "true" : "false"\)' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing aria-expanded toggle in $SOURCE"
  exit 1
}
rg -n 'event\.key !== "Escape"' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing ESC close handling in $SOURCE"
  exit 1
}
rg -n 'trigger\.contains\(target\) \|\| menu\.contains\(target\)' "$SOURCE" >/dev/null || {
  echo "❌ FAIL: missing click-outside close handling in $SOURCE"
  exit 1
}

echo "✅ PASS: dropdown deterministic bindings present in PROD+source checks"
