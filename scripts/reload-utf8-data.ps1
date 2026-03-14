#!/usr/bin/env pwsh
# Reload sample data preserving UTF-8 accented characters (ñ, á, é, etc.)
# Standard PowerShell pipe mangles multibyte chars — this uses raw file redirection instead.

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
$sqlFile  = Join-Path $repoRoot "database\load-sample-data.sql"
$app      = "nailsco-db"
$database = "nailsandco"

if (-not (Test-Path $sqlFile)) {
    Write-Error "SQL file not found: $sqlFile"
    exit 1
}

Write-Host "==> Reloading sample data (UTF-8 safe)..."
Write-Host "    File   : $sqlFile"
Write-Host "    App    : $app"
Write-Host "    DB     : $database"
Write-Host ""

# Start-Process with -RedirectStandardInput sends raw file bytes — no PowerShell encoding conversion.
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
Write-Host "==> Done! Verify with:"
Write-Host "    echo `"SELECT name FROM services LIMIT 5;`" | flyctl postgres connect -a $app -d $database"
