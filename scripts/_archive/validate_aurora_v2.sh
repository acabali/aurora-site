#!/usr/bin/env bash
set -euo pipefail

PUBLIC_URL="https://aurora-site-brown.vercel.app"
LOCAL_URL="http://localhost:4322"

echo
echo "=============================="
echo "AURORA V2 SYSTEM VALIDATION"
echo "=============================="
echo

echo "Repo location:"
pwd
echo

echo "1. BUILD TEST"
pnpm build >/dev/null
echo "✔ build passed"
echo

echo "2. INTERNAL VALIDATORS"

bash scripts/validation/validate_web_expression.sh >/dev/null
echo "✔ validate_web_expression OK"

bash scripts/validation/validate_demo_expression_claim.sh >/dev/null
echo "✔ validate_demo_expression_claim OK"

echo
echo "3. CHECK NEW COMPONENTS"

test -f src/components/SystemStatus.astro && echo "✔ SystemStatus component present" || echo "✘ SystemStatus missing"
test -f src/components/DecisionPreview.astro && echo "✔ DecisionPreview component present" || echo "✘ DecisionPreview missing"

echo
echo "4. CHECK HOMEPAGE STRUCTURE"

rg -q "hero" src/components/AuroraLanding.astro && echo "✔ hero section found"
rg -q "que-cambio" src/components/AuroraLanding.astro && echo "✔ que-cambio section found"
rg -q "desajuste" src/components/AuroraLanding.astro && echo "✔ desajuste section found"
rg -q "aurora" src/components/AuroraLanding.astro && echo "✔ aurora section found"
rg -q "evaluates" src/components/AuroraLanding.astro && echo "✔ evaluates section found"
rg -q "scenarios" src/components/AuroraLanding.astro && echo "✔ scenarios section found"
rg -q "risk" src/components/AuroraLanding.astro && echo "✔ risk section found"
rg -q "differentiation" src/components/AuroraLanding.astro && echo "✔ differentiation section found"
rg -q "demo" src/components/AuroraLanding.astro && echo "✔ demo section found"

echo
echo "5. CHECK HERO COPY"

rg -q "Probás todo menos el plan" src && echo "✔ hero title present" || echo "✘ hero title missing"
rg -q "Aurora somete una decisión" src && echo "✔ hero subtitle present" || echo "✘ hero subtitle missing"

echo
echo "6. CHECK SYSTEM STATUS"

rg -q "AURORA SYSTEM ACTIVE" src && echo "✔ system status indicator present" || echo "✘ system status missing"

echo
echo "7. START LOCAL SERVER IF NEEDED"

if ! lsof -i :4322 >/dev/null ; then
    echo "Starting local preview server"
    python3 -m http.server 4322 -d dist >/dev/null 2>&1 &
    sleep 2
fi

echo "✔ local server ready"

echo
echo "8. FETCH LOCAL HTML"

curl -s $LOCAL_URL > /tmp/aurora_local.html
echo "✔ local HTML captured"

echo
echo "9. FETCH PUBLIC HTML"

curl -s $PUBLIC_URL > /tmp/aurora_public.html
echo "✔ public HTML captured"

echo
echo "10. PUBLIC HERO CHECK"

rg -q "Probás todo menos el plan" /tmp/aurora_public.html && echo "✔ public hero updated" || echo "⚠ public hero still old"

echo
echo "11. PUBLIC SYSTEM STATUS"

rg -q "AURORA SYSTEM ACTIVE" /tmp/aurora_public.html && echo "✔ system status visible" || echo "⚠ system status not deployed"

echo
echo "12. LOCAL VS PUBLIC DIFF"

if diff /tmp/aurora_local.html /tmp/aurora_public.html >/dev/null ; then
    echo "✔ local and public match"
else
    echo "⚠ local and public differ (deploy likely pending)"
fi

echo
echo "=============================="
echo "VALIDATION COMPLETE"
echo "=============================="
echo
echo "Public site:"
echo $PUBLIC_URL
echo
