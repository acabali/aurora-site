#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/aurora-site"
ALIAS="https://aurora-site-brown.vercel.app"

cd "$REPO" || exit 1

echo "== AURORA DEPLOY vΩ =="

HEAD=$(git rev-parse HEAD)

echo "HEAD: $HEAD"

echo
echo "== PRECHECK =="

git status

echo
echo "== CLEAN BUILD =="

rm -rf .astro
rm -rf dist

pnpm build

echo
echo "== PUSH =="

git push origin main

echo
echo "== DEPLOY =="

vercel --prod --force

echo
echo "== VERIFY PROD =="

HTML=$(curl -fsSL "$ALIAS")

BUILD=$(echo "$HTML" | rg -o 'data-build="[^"]+"' | head -n1 | sed 's/data-build="//' | sed 's/"//')

echo "prod build: $BUILD"

if [[ "$BUILD" != "$HEAD"* ]]; then
  echo "ABORT: prod no coincide con HEAD"
  exit 1
fi

echo
echo "== UI CHECK =="

echo "$HTML" | rg "SYSTEM MODULES" >/dev/null || { echo "ABORT UI missing"; exit 1; }

echo "$HTML" | rg "ADVANCED CAPABILITIES" >/dev/null || { echo "ABORT UI missing"; exit 1; }

echo
echo "== VERCEL DEPLOYMENTS =="

vercel ls | head -n 10

echo
echo "AURORA DEPLOY PASS"
