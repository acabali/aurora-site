#!/usr/bin/env bash
set -euo pipefail

cd ~/aurora-site

PROJECT_ID=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])")
TEAM_ID=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['orgId'])")

DEPLOY_ID=$(vercel inspect https://aurora-site-brown.vercel.app 2>&1 | rg -o 'dpl_[A-Za-z0-9]+' | head -n1)

PROD_BRANCH=$(vercel api "/v13/deployments/$DEPLOY_ID?teamId=$TEAM_ID" | rg '"githubCommitRef"' | head -n1)

CONFIG_BRANCH=$(vercel api "/v9/projects/$PROJECT_ID?teamId=$TEAM_ID" | rg '"productionBranch"' | head -n1)

echo "Production commit branch:"
echo "$PROD_BRANCH"
echo
echo "Configured productionBranch:"
echo "$CONFIG_BRANCH"
echo

if echo "$PROD_BRANCH" | grep -q "main"; then
  echo "✅ Producción alineada con main"
else
  echo "❌ ALERTA: Producción NO viene de main"
  exit 1
fi
