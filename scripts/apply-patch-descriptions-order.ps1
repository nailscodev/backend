#!/usr/bin/env pwsh
# Apply patch: fix Removals descriptions + addon displayOrder for Acrylic/Refill services
# Uses flyctl (same as reload-utf8-data.ps1) to preserve UTF-8 characters.

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
$sqlFile  = Join-Path $repoRoot "database\patch-descriptions-and-order.sql"
$app      = "nailsco-db"
$database = "nailsandco"

if (-not (Test-Path $sqlFile)) {
    Write-Error "SQL file not found: $sqlFile"
    exit 1
}

Write-Host "==> Applying patch: descriptions + addon displayOrder..."
Write-Host "    File   : $sqlFile"
Write-Host "    App    : $app"
Write-Host "    DB     : $database"
Write-Host ""

$proc = Start-Process `
    -FilePath "flyctl" `
    -ArgumentList "postgres connect -a $app -d $database" `
    -RedirectStandardInput $sqlFile `
    -NoNewWindow `
    -Wait `
    -PassThru

if ($proc.ExitCode -ne 0) {
    Write-Error "flyctl exited with code $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host ""
Write-Host "==> Done! Verify addon order with:"
Write-Host "    echo ""SELECT name, \`"displayOrder\`" FROM addons WHERE name LIKE 'Acrylic%' OR name LIKE '%Refill%' OR name LIKE 'Additional%' ORDER BY \`"displayOrder\`";"" | flyctl postgres connect -a $app -d $database"
