#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_info "Running pre-deployment checks..."

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "RESEND_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    log_error "Missing required environment variable: $var"
    exit 1
  fi
done

log_info "All environment variables present ✓"

log_info "Installing dependencies..."
npm ci 2>/dev/null || npm install

log_info "Running TypeScript type check..."
npm run type-check

log_info "Building Next.js application..."
npm run build

log_info "Deploying Supabase Edge Functions..."

supabase functions deploy process-reminder
supabase functions deploy cron-scheduler

log_info "Setting Supabase secrets..."

supabase secrets set TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"
supabase secrets set TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"
supabase secrets set TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"
supabase secrets set WEBHOOK_URL="${WEBHOOK_URL:-}"
supabase secrets set RESEND_FROM="${RESEND_FROM:-Reminders <noreply@yourdomain.com>}"

log_info "Running database migrations..."
supabase db push

log_info "Verifying deployment..."

if curl -s "${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cron-scheduler" >/dev/null 2>&1; then
  log_info "Edge functions responding ✓"
else
  log_warn "Edge functions may not be fully deployed yet"
fi

log_info "Deployment complete."
log_info "Next: schedule pg_cron in Supabase SQL Editor (see migration comments), test the app URL, and run: supabase functions logs"
