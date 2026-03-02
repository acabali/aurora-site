#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://aurora-site-brown.vercel.app}"
TMP_HTML="$(mktemp)"
trap 'rm -f "$TMP_HTML"' EXIT

echo "== AURORA WEB vΩ FULL VALIDATION =="
echo "Repo: $(pwd)"
echo "BASE: $BASE"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ FAIL: working tree is not clean"
  git status --short
  exit 1
fi
echo "✅ Git status clean"

./ops/guard_home_ts_immutable.sh
./ops/ban_copy_guard.sh

pnpm -s build
echo "✅ Build OK"

home_code="$(curl -s -o /dev/null -w "%{http_code}" -I "$BASE/")"
demo_code="$(curl -s -o /dev/null -w "%{http_code}" -I "$BASE/demo")"
echo "HOME=$home_code"
echo "DEMO=$demo_code"
if [[ "$home_code" != "200" || "$demo_code" != "200" ]]; then
  echo "❌ FAIL: expected HOME=200 and DEMO=200"
  exit 1
fi

curl -fsSL "$BASE/" > "$TMP_HTML"
rg -n 'site-products-trigger|site-products-menu' "$TMP_HTML" >/dev/null || {
  echo "❌ FAIL: missing dropdown IDs in prod HTML"
  exit 1
}
echo "✅ Prod HTML includes dropdown IDs"

rg -n "site-products-trigger" src/layouts/PageLayout.astro >/dev/null || {
  echo "❌ FAIL: missing trigger id reference in source"
  exit 1
}
rg -n "addEventListener\\([\"']click" src/layouts/PageLayout.astro >/dev/null || {
  echo "❌ FAIL: missing click listener in source"
  exit 1
}
echo "✅ Source bindings present"

if [[ -x "./ops/qa_prod_dropdown.sh" ]]; then
  ./ops/qa_prod_dropdown.sh
fi

echo "✅ WEB vΩ FULL VALIDATION COMPLETE"
