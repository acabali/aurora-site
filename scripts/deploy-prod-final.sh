#!/usr/bin/env bash
# deploy-prod-final.sh — actualizar envs Vercel, deploy --prod, validar.
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AURORA_CONTROL="${AURORA_CONTROL:-$HOME/Aurora/aurora-control}"
URL_FILE="$AURORA_CONTROL/backend-url.txt"

if [[ ! -f "$URL_FILE" ]]; then
  echo "ABORT: $URL_FILE not found. Run connect-backend.sh first."
  exit 1
fi

BACKEND_URL="$(cat "$URL_FILE" | tr -d '\n\r' | sed 's|/$||')"
AURORA_OS_ROOT="${AURORA_OS_ROOT:-$HOME/Aurora/repos/aurora-os}"

for f in "$AURORA_OS_ROOT/.env.local" "$AURORA_OS_ROOT/.env"; do
  if [[ -f "$f" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
    break
  fi
done

: "${AURORA_API_KEY:?ABORT: AURORA_API_KEY required}"
: "${AURORA_API_SECRET:?ABORT: AURORA_API_SECRET required}"

cd "$SITE_ROOT"

echo "== Actualizando envs en Vercel (production, preview, development) =="
for env in production preview development; do
  printf '%s' "$BACKEND_URL" | vercel env add AURORA_OS_BASE_URL "$env" --force 2>/dev/null || \
    printf '%s' "$BACKEND_URL" | vercel env add AURORA_OS_BASE_URL "$env" 2>/dev/null || true
  printf '%s' "$AURORA_API_KEY" | vercel env add AURORA_API_KEY "$env" --force 2>/dev/null || \
    printf '%s' "$AURORA_API_KEY" | vercel env add AURORA_API_KEY "$env" 2>/dev/null || true
  printf '%s' "$AURORA_API_SECRET" | vercel env add AURORA_API_SECRET "$env" --force 2>/dev/null || \
    printf '%s' "$AURORA_API_SECRET" | vercel env add AURORA_API_SECRET "$env" 2>/dev/null || true
done

echo "== Deploy vercel --prod =="
DEPLOY_OUT="$(mktemp)"
vercel --prod --yes 2>&1 | tee "$DEPLOY_OUT"

# Obtener URL del deploy
FRONTEND_URL="$(grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' "$DEPLOY_OUT" | tail -1)"
rm -f "$DEPLOY_OUT"
if [[ -z "$FRONTEND_URL" ]]; then
  FRONTEND_URL="$(vercel ls 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1)"
fi
if [[ -z "$FRONTEND_URL" ]]; then
  FRONTEND_URL="https://aurora-site-brown.vercel.app"
fi

echo "== Validando $FRONTEND_URL =="

# GET /
STATUS_HOME=$(curl -sS -o /tmp/aurora_home.html -w '%{http_code}' "$FRONTEND_URL/")
if [[ "$STATUS_HOME" != "200" ]]; then
  echo "ABORT: GET / returned $STATUS_HOME"
  exit 1
fi

# GET /demo
STATUS_DEMO=$(curl -sS -o /tmp/aurora_demo.html -w '%{http_code}' -L "$FRONTEND_URL/demo")
if [[ "$STATUS_DEMO" != "200" ]]; then
  echo "ABORT: GET /demo returned $STATUS_DEMO"
  exit 1
fi

# GET /api/system-state (relay)
STATUS_SYSTEM=$(curl -sS -o /tmp/aurora_system.json -w '%{http_code}' "$FRONTEND_URL/api/system-state")
if [[ "$STATUS_SYSTEM" != "200" ]]; then
  echo "ABORT: GET /api/system-state returned $STATUS_SYSTEM"
  cat /tmp/aurora_system.json | head -3
  exit 1
fi
if grep -q "<html" /tmp/aurora_system.json 2>/dev/null; then
  echo "ABORT: /api/system-state returned HTML"
  exit 1
fi
if grep -qi "upstreamError\|upstreamStatus.*[45][0-9][0-9]" /tmp/aurora_system.json 2>/dev/null; then
  echo "ABORT: /api/system-state reported upstream error"
  exit 1
fi

# POST /api/decision (relay)
STATUS_DECISION=$(curl -sS -o /tmp/aurora_decision.json -w '%{http_code}' \
  -X POST "$FRONTEND_URL/api/decision" \
  -H "Content-Type: application/json" \
  -d '{"capital":10000,"absorption":"yes","reversibility":"high"}')
if [[ "$STATUS_DECISION" != "200" ]]; then
  echo "ABORT: POST /api/decision returned $STATUS_DECISION"
  cat /tmp/aurora_decision.json | head -3
  exit 1
fi
if grep -q "<html" /tmp/aurora_decision.json 2>/dev/null; then
  echo "ABORT: /api/decision returned HTML"
  exit 1
fi
if grep -qi "upstreamError\|upstreamStatus.*[45][0-9][0-9]" /tmp/aurora_decision.json 2>/dev/null; then
  echo "ABORT: /api/decision reported upstream error"
  exit 1
fi

# E2E demo flow: POST /api/decision (demo payload) → respuesta útil
curl -sS -o /tmp/aurora_demo_decision.json -X POST "$FRONTEND_URL/api/decision" \
  -H "Content-Type: application/json" \
  -d '{"capital":50000,"absorption":"yes","reversibility":"high"}'
if ! node -e "
const fs=require('fs');
const raw=fs.readFileSync('/tmp/aurora_demo_decision.json','utf8');
let p; try{p=JSON.parse(raw);}catch(e){process.exit(1);}
if(raw.includes('<html')) process.exit(1);
const d=p?.data||p;
const canon=d?.canonical||d;
const hasId=!!(canon?.decision_id||d?.legacy);
const summary=(canon?.executive_summary||canon?.recommendation||'').trim();
if(!hasId||summary.length<10) process.exit(1);
" 2>/dev/null; then
  echo "ABORT: demo flow did not return useful response (decision_id, executive_summary/recommendation)"
  cat /tmp/aurora_demo_decision.json | head -5
  exit 1
fi
echo "E2E demo flow OK"

echo ""
echo "GET / OK"
echo "GET /demo OK"
echo "GET /api/system-state OK"
echo "POST /api/decision OK"
mkdir -p "$AURORA_CONTROL"
echo "$FRONTEND_URL" > "$AURORA_CONTROL/frontend-url.txt"

echo ""
echo "DEPLOY_PROD_FINAL_OK=1"
echo "Frontend: $FRONTEND_URL"
