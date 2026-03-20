#!/usr/bin/env bash
# connect-backend.sh — leer backend-url.txt, escribir .env.local, validar.
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AURORA_OS_ROOT="${AURORA_OS_ROOT:-$HOME/Aurora/repos/aurora-os}"
AURORA_CONTROL="${AURORA_CONTROL:-$HOME/Aurora}"
URL_FILE="$AURORA_CONTROL/backend-url.txt"

if [[ ! -f "$URL_FILE" ]]; then
  echo "ABORT: $URL_FILE not found. Run post-host-setup.sh in aurora-os first."
  exit 1
fi

BACKEND_URL="$(cat "$URL_FILE" | tr -d '\n\r' | sed 's|/$||')"

if [[ -z "$BACKEND_URL" ]]; then
  echo "ABORT: backend-url.txt is empty"
  exit 1
fi

if [[ "$BACKEND_URL" == *"trycloudflare"* ]]; then
  echo "ABORT: backend URL contains trycloudflare"
  exit 1
fi

if [[ "$BACKEND_URL" != https://* ]]; then
  echo "ABORT: backend URL must start with https://"
  exit 1
fi

# Obtener keys desde aurora-os .env
if [[ ! -f "$AURORA_OS_ROOT/.env" ]] && [[ ! -f "$AURORA_OS_ROOT/.env.local" ]]; then
  echo "ABORT: aurora-os .env not found. Need AURORA_API_KEY, AURORA_API_SECRET"
  exit 1
fi

ENV_OS=""
for f in "$AURORA_OS_ROOT/.env.local" "$AURORA_OS_ROOT/.env"; do
  if [[ -f "$f" ]]; then
    ENV_OS="$f"
    break
  fi
done

set -a
# shellcheck disable=SC1090
source "$ENV_OS"
set +a

: "${AURORA_API_KEY:?ABORT: AURORA_API_KEY not set in $ENV_OS}"
: "${AURORA_API_SECRET:?ABORT: AURORA_API_SECRET not set in $ENV_OS}"

# Escribir .env.local limpio
cat > "$SITE_ROOT/.env.local" << EOF
AURORA_OS_BASE_URL=$BACKEND_URL
AURORA_API_KEY=$AURORA_API_KEY
AURORA_API_SECRET=$AURORA_API_SECRET
EOF

echo "== .env.local actualizado =="
echo "AURORA_OS_BASE_URL=$BACKEND_URL"

# Validar y build
cd "$SITE_ROOT"
pnpm repo:check
pnpm repo:smoke
pnpm repo:build

echo ""
echo "CONNECT_BACKEND_OK=1"
echo "aurora-site ready to deploy (Vercel)"
