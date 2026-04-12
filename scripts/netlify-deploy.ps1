# Deploy this Next.js site to Netlify (production).
#
# Prerequisites (one-time):
#   1. Netlify → User settings → OAuth applications → Personal access tokens → New access token
#   2. Link this folder to your site (replace SITE_ID from Site settings → Site details → Site ID):
#        $env:NETLIFY_AUTH_TOKEN = "YOUR_TOKEN"
#        npx netlify-cli link --id YOUR_SITE_ID
#      Or create/link interactively:
#        npx netlify-cli init
#
# Every deploy:
#   $env:NETLIFY_AUTH_TOKEN = "YOUR_TOKEN"
#   .\scripts\netlify-deploy.ps1
#
# After first successful deploy, set environment variables in:
#   Netlify → Site → Environment variables (copy from .env.local, never commit .env.local)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not $env:NETLIFY_AUTH_TOKEN) {
  Write-Host "Set NETLIFY_AUTH_TOKEN first (Netlify personal access token)." -ForegroundColor Red
  exit 1
}

npx --yes netlify-cli deploy --prod
