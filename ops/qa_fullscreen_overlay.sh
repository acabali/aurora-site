#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://aurora-site-brown.vercel.app}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_HTML="$(mktemp -t aurora-fullscreen-html.XXXXXX)"
trap 'rm -f "$TMP_HTML"' EXIT

log() {
  printf "[fullscreen-qa] %s\n" "$*"
}

fail() {
  printf "[fullscreen-qa] FAIL: %s\n" "$*" >&2
  exit 1
}

run_repo_scan() {
  log "Repo scan: fullscreen/pointer/overlay triggers"
  local hard_fail
  hard_fail="$(rg -n "requestFullscreen|webkitRequestFullscreen|requestPointerLock" "$REPO_ROOT/src" || true)"
  if [[ -n "$hard_fail" ]]; then
    printf "%s\n" "$hard_fail"
    fail "Found fullscreen/pointer-lock TRIGGER API usage in src/"
  fi

  local observability
  observability="$(rg -n "exitFullscreen|fullscreenchange|pointerlockchange|pointerLockElement|fullscreenElement|webkitFullscreenElement" "$REPO_ROOT/src" || true)"
  if [[ -n "$observability" ]]; then
    printf "%s\n" "$observability"
    log "WARN observability hooks present (non-trigger APIs)"
  fi
  log "PASS repo scan: no fullscreen/pointer-lock TRIGGER API usage in src/"
}

run_keyword_inventory() {
  log "Keyword inventory (forensic visibility only)"
  rg -n "fullscreen|webkit|pointer|requestAnimationFrame|keydown|overflow|touch-action|overscroll" "$REPO_ROOT/src" || true
}

scan_served_html() {
  local url="$1"
  log "Downloading HTML: $url"
  curl -fsSL \
    -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" \
    -H "Accept-Language: en-US,en;q=0.9" \
    "$url" > "$TMP_HTML"

  if rg -n "To exit full screen|exit full screen" "$TMP_HTML" >/dev/null; then
    fail "Overlay text found in served HTML at $url"
  fi

  if rg -n "requestFullscreen|webkitRequestFullscreen|requestPointerLock|pointerlock|fullscreenchange" "$TMP_HTML" >/dev/null; then
    fail "Fullscreen/pointer-lock markers found in served HTML at $url"
  fi

  log "PASS HTML scan: no overlay/fullscreen markers in served HTML"
}

print_manual_console_block() {
  cat <<'EOF'

[fullscreen-qa] Manual browser console check (copy/paste):

(() => {
  const result = {
    hasOverlayTextInDom: document.body.innerText.includes("To exit full screen"),
    matchingNodes: [...document.querySelectorAll("*")].filter(el =>
      el.innerText?.includes("exit full screen")
    ).length,
    iframeCount: document.querySelectorAll("iframe").length,
    fullscreenElement: document.fullscreenElement,
    webkitFullscreenElement: document.webkitFullscreenElement,
    displayModeFullscreen: window.matchMedia("(display-mode: fullscreen)").matches,
    pointerLockElement: document.pointerLockElement,
    outerEqualsScreen: window.outerHeight === screen.height,
  };
  console.table(result);
  return result;
})();

Expected PASS:
- hasOverlayTextInDom = false
- matchingNodes = 0
- iframeCount = 0 (or known trusted embeds)
- fullscreenElement = null
- webkitFullscreenElement = null
- displayModeFullscreen = false
- pointerLockElement = null
EOF
}

main() {
  [[ -d "$REPO_ROOT/.git" ]] || fail "Not in a git repository"
  run_repo_scan
  run_keyword_inventory
  scan_served_html "$BASE_URL"
  print_manual_console_block
  log "DONE: automated checks passed for $BASE_URL"
}

main "$@"
