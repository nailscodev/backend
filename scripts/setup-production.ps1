# setup-production.ps1
# One-time setup for Nails & Co. production environment on Fly.io
# Run this ONCE before the first production deployment.
# Prerequisites: flyctl installed and authenticated (fly auth login)
#
# Creates a SEPARATE Fly.io organization 'nailsco-prod' so that production
# apps appear isolated from sandbox ('Personal') in the dashboard.

$ErrorActionPreference = "Stop"

$PROD_ORG = "nailsco-prod"

Write-Host "=== Nails & Co. Production Setup ===" -ForegroundColor Cyan
Write-Host "Org: $PROD_ORG (separate from sandbox 'Personal')" -ForegroundColor Yellow
Write-Host "It is safe to run — it checks if each resource already exists first." -ForegroundColor Yellow
Write-Host ""

# ── 0. Create production org ──────────────────────────────────────────────────
Write-Host "[0/6] Creating Fly.io organization '$PROD_ORG'..." -ForegroundColor Green

$orgExists = flyctl orgs list --json | ConvertFrom-Json | Where-Object { $_.Slug -eq $PROD_ORG }
if ($orgExists) {
    Write-Host "  ✓ Org '$PROD_ORG' already exists — skipping" -ForegroundColor DarkGray
} else {
    flyctl orgs create $PROD_ORG
    Write-Host "  ✓ Created org '$PROD_ORG'" -ForegroundColor Green
}

# ── 1. Create apps ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[1/6] Creating Fly.io apps under org '$PROD_ORG'..." -ForegroundColor Green

$apps = @("nailsco-backend-prod", "nailsco-frontend-prod", "nailsco-backoffice-prod")
foreach ($app in $apps) {
    $exists = flyctl apps list --org $PROD_ORG --json | ConvertFrom-Json | Where-Object { $_.Name -eq $app }
    if ($exists) {
        Write-Host "  ✓ App '$app' already exists — skipping" -ForegroundColor DarkGray
    } else {
        flyctl apps create $app --org $PROD_ORG
        Write-Host "  ✓ Created '$app'" -ForegroundColor Green
    }
}

# ── 2. Create production Postgres ─────────────────────────────────────────────
Write-Host ""
Write-Host "[2/6] Creating production Postgres cluster under org '$PROD_ORG'..." -ForegroundColor Green

$pgExists = flyctl apps list --org $PROD_ORG --json | ConvertFrom-Json | Where-Object { $_.Name -eq "nailsco-db-prod" }
if ($pgExists) {
    Write-Host "  ✓ Postgres 'nailsco-db-prod' already exists — skipping" -ForegroundColor DarkGray
} else {
    flyctl pg create `
        --name nailsco-db-prod `
        --org $PROD_ORG `
        --region iad `
        --initial-cluster-size 1 `
        --vm-size shared-cpu-1x `
        --volume-size 10
    Write-Host "  ✓ Created Postgres 'nailsco-db-prod'" -ForegroundColor Green
}

# ── 3. Attach Postgres to backend (sets DATABASE_URL secret automatically) ────
Write-Host ""
Write-Host "[3/6] Attaching Postgres to backend app..." -ForegroundColor Green

$secrets = flyctl secrets list --app nailsco-backend-prod --json 2>$null | ConvertFrom-Json
$dbUrlSet = $secrets | Where-Object { $_.Name -eq "DATABASE_URL" }
if ($dbUrlSet) {
    Write-Host "  ✓ DATABASE_URL already set on nailsco-backend-prod — skipping attach" -ForegroundColor DarkGray
} else {
    flyctl pg attach nailsco-db-prod --app nailsco-backend-prod
    Write-Host "  ✓ Postgres attached — DATABASE_URL injected as secret" -ForegroundColor Green
}

# ── 4. Set required backend secrets ───────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Setting backend secrets..." -ForegroundColor Green
Write-Host "  You will be prompted to enter secret values." -ForegroundColor Yellow
Write-Host "  Press ENTER to skip a secret if it is already set." -ForegroundColor Yellow
Write-Host ""

function Set-FlySecret {
    param([string]$AppName, [string]$SecretName, [string]$Prompt)
    $val = Read-Host "$Prompt (leave blank to skip)"
    if ($val) {
        flyctl secrets set "$SecretName=$val" --app $AppName
        Write-Host "  ✓ $SecretName set" -ForegroundColor Green
    } else {
        Write-Host "  — $SecretName skipped" -ForegroundColor DarkGray
    }
}

Set-FlySecret "nailsco-backend-prod" "JWT_SECRET"          "JWT_SECRET (min 32 chars, different from sandbox)"
Set-FlySecret "nailsco-backend-prod" "JWT_REFRESH_SECRET"  "JWT_REFRESH_SECRET (min 32 chars)"
Set-FlySecret "nailsco-backend-prod" "ENCRYPTION_KEY"      "ENCRYPTION_KEY (exactly 32 chars, AES-256)"
Set-FlySecret "nailsco-backend-prod" "AXIOM_TOKEN"         "AXIOM_TOKEN (from Axiom dashboard)"
Set-FlySecret "nailsco-backend-prod" "SMTP_GMAIL_USER"     "SMTP_GMAIL_USER (Gmail address)"
Set-FlySecret "nailsco-backend-prod" "SMTP_GMAIL_PASS"     "SMTP_GMAIL_PASS (Gmail app password)"

# ── 5. Apply database schema ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Database schema setup..." -ForegroundColor Green
Write-Host "  To apply the schema, run ONE of the following options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Option A — via flyctl proxy (recommended):" -ForegroundColor Cyan
Write-Host "    flyctl pg connect -a nailsco-db-prod" -ForegroundColor White
Write-Host "    # Then in the psql shell:" -ForegroundColor DarkGray
Write-Host "    \i database/create-tables.sql" -ForegroundColor White
Write-Host ""
Write-Host "  Option B — set DB_SYNC=true temporarily as a backend secret," -ForegroundColor Cyan
Write-Host "    deploy backend once, then unset it:" -ForegroundColor Cyan
Write-Host "    flyctl secrets set DB_SYNC=true --app nailsco-backend-prod" -ForegroundColor White
Write-Host "    # after first deploy:" -ForegroundColor DarkGray
Write-Host "    flyctl secrets unset DB_SYNC --app nailsco-backend-prod" -ForegroundColor White
Write-Host ""

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "=== Setup complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Apply database schema (Option A or B above)"
Write-Host "  2. Create the 'production' branch in each repo:"
Write-Host "       git checkout main"
Write-Host "       git checkout -b production"
Write-Host "       git push origin production"
Write-Host "  3. Add GitHub Actions secret 'BACKEND_PROD_URL' = 'https://nailsco-backend-prod.fly.dev'"
Write-Host "     (in the backend repo settings → Secrets and variables → Actions)"
Write-Host ""
Write-Host "Production URLs (after first deploy):" -ForegroundColor Cyan
Write-Host "  Backend:   https://nailsco-backend-prod.fly.dev"
Write-Host "  Frontend:  https://nailsco-frontend-prod.fly.dev"
Write-Host "  Backoffice: https://nailsco-backoffice-prod.fly.dev"
Write-Host ""
Write-Host "[6/6] Done! In the Fly.io dashboard, switch organization" -ForegroundColor Cyan
Write-Host "      to '$PROD_ORG' (top-left selector) to see only production apps," -ForegroundColor Cyan
Write-Host "      completely separate from sandbox ('Personal org')." -ForegroundColor Cyan
