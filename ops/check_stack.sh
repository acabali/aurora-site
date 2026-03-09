#!/usr/bin/env bash
set -euo pipefail
cd ~/aurora-site

echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
[ -f .nvmrc ] && echo ".nvmrc OK"
[ -f .env.example ] && echo ".env.example OK"
[ -f supabase/migrations/20260309_aurora_memory.sql ] && echo "supabase migration OK"
[ -f src/lib/knowledge/supabase.ts ] && echo "supabase client OK"
[ -f src/lib/ai/providers.ts ] && echo "providers OK"
[ -f src/pages/api/cron/ingest.ts ] && echo "cron endpoint OK"
[ -f vercel.json ] && echo "vercel cron OK"
