#!/usr/bin/env bash
set -Eeuo pipefail

RED="\033[0;31m"
GRN="\033[0;32m"
BLU="\033[0;34m"
NC="\033[0m"

log() { printf "${BLU}==>${NC} %s\n" "$*"; }
ok()  { printf "${GRN}OK${NC}  %s\n" "$*"; }
err() { printf "${RED}ERR${NC} %s\n" "$*" >&2; }

die() {
  err "$*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Falta comando requerido: $1"
}

require_cmd npm
require_cmd vercel
require_cmd rg

cd ~/aurora-site || die "No existe ~/aurora-site"

[[ -f .env.local ]] || die "Falta .env.local. Copiá .env.example y completá las credenciales reales."

if rg -n "trycloudflare|placeholder|changeme|replace-me|example\\.com|localhost" .env.local >/dev/null 2>&1; then
  die "AURORA_OS_BASE_URL no es deployable. Usá un host persistente para Aurora OS; no quick tunnels, placeholders ni localhost ambiguo."
fi

if rg -n "127\\.0\\.0\\.1:8787" .env.local >/dev/null 2>&1; then
  die "AURORA_OS_BASE_URL apunta al backend local. Eso sirve para repo:dev, pero no para deploy estable. Configurá un host persistente primero."
fi

log "1. Ejecutando gate determinista previo al deploy"
npm run repo:deploy:check
ok "repo:deploy:check PASS"

if [[ "${1:-}" != "--deploy" ]]; then
  echo
  echo "Deploy estable listo para ejecución."
  echo "Cuando el host persistente de Aurora OS esté configurado también en el entorno de producción, corré:"
  echo "  scripts/aurora-public-link-and-deploy.sh --deploy"
  exit 0
fi

log "2. Deploy productivo"
vercel --prod
