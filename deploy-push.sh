#!/bin/bash
# CARAXES — Script tout-en-un pour activer le push serveur
# Utilisation : ./deploy-push.sh <SUPABASE_ACCESS_TOKEN> [DB_PASSWORD]

set -e

ACCESS_TOKEN="${1:-$SUPABASE_ACCESS_TOKEN}"
DB_PASSWORD="${2:-$SUPABASE_DB_PASSWORD}"
PROJECT_REF="nmuqzzedlxilnbpnalsf"
SUPABASE_URL="https://nmuqzzedlxilnbpnalsf.supabase.co"

VAPID_PUBLIC="BF402QrdCSf5IuBUV21a5BrmHpo-ZlfSGIYspwLkm7sNt-XLunQ802jKApO7ceydrwLX_tQQtYcjgDb2VLh3Yio"
VAPID_PRIVATE="B1U3hnjYrB6octGv4tX-cHnkHZl_mU-F7640h6Ry7t8"
VAPID_SUBJECT="mailto:contact@caraxes.fr"

SUPABASE_BIN="/tmp/supabase"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Fournis le Personal Access Token en argument 1"
  echo "   Récupère-le sur https://supabase.com/dashboard/account/tokens"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"
cd "$(dirname "$0")"

echo "▶ 1/4  Link au projet $PROJECT_REF…"
if [ -n "$DB_PASSWORD" ]; then
  $SUPABASE_BIN link --project-ref "$PROJECT_REF" -p "$DB_PASSWORD" 2>&1 | tail -5
else
  $SUPABASE_BIN link --project-ref "$PROJECT_REF" 2>&1 | tail -5
fi

echo "▶ 2/4  Run migration push_subscriptions…"
# Via Management API SQL endpoint — plus fiable que db push sans password
curl -sS -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' < supabase/migrations/push_subscriptions.sql)" \
  | jq '.' || echo "(migration output non-JSON — vérifie manuellement)"

echo "▶ 3/4  Set Edge Function secrets…"
$SUPABASE_BIN secrets set --project-ref "$PROJECT_REF" \
  VAPID_PUBLIC_KEY="$VAPID_PUBLIC" \
  VAPID_PRIVATE_KEY="$VAPID_PRIVATE" \
  VAPID_SUBJECT="$VAPID_SUBJECT" 2>&1 | tail -10

echo "▶ 4/4  Deploy Edge Function send-push…"
$SUPABASE_BIN functions deploy send-push \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt 2>&1 | tail -10

echo ""
echo "✅ Push serveur ACTIVÉ"
echo "   Test : ouvre app.caraxes.fr sur ton phone, active les notifs,"
echo "   puis depuis /admin déplace une carte Kanban."
