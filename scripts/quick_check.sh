#!/usr/bin/env bash

echo ""
echo "=============================="
echo "AURORA QUICK CHECK"
echo "=============================="

echo ""
echo "Repo:"
pwd

echo ""
echo "Git status:"
git status --short

echo ""
echo "Checking core components..."

FILES=(
"src/components/AuroraLanding.astro"
"src/components/AuroraField.astro"
"src/components/SystemInterface.astro"
"src/components/SystemArchitecture.astro"
"src/components/SystemStatus.astro"
"src/components/site/SiteHeader.astro"
)

for file in "${FILES[@]}"
do
  if [ -f "$file" ]; then
    echo "OK  $file"
  else
    echo "MISS $file"
  fi
done

echo ""
echo "Checking if motion changed..."

git diff -- src/components/AuroraField.astro

echo ""
echo "Running build test..."

pnpm build >/dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "BUILD OK"
else
  echo "BUILD FAILED"
fi

echo ""
echo "Validator check..."

if [ -f scripts/validation/validate_web_expression.sh ]; then
  bash scripts/validation/validate_web_expression.sh | grep STATUS
else
  echo "validate_web_expression.sh not found"
fi

if [ -f scripts/validation/validate_demo_expression_claim.sh ]; then
  bash scripts/validation/validate_demo_expression_claim.sh | grep STATUS
else
  echo "validate_demo_expression_claim.sh not found"
fi

echo ""
echo "=============================="
echo "QUICK CHECK COMPLETE"
echo "=============================="
