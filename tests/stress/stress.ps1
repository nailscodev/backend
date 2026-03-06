# Nails & Co — Stress Test Runner
#
# Usage (desde cualquier directorio):
#   .\stress.ps1
#   .\stress.ps1 -Phase warmup
#   .\stress.ps1 -Phase normal
#   .\stress.ps1 -Phase peak
#   .\stress.ps1 -Report
#   .\stress.ps1 -Phase peak -Report
#   .\stress.ps1 -Target http://localhost:3001
#   .\stress.ps1 -Phase peak -Target http://localhost:3001 -Report
#
# Con -Report guarda stress-report_<timestamp>.json y .html en tests/stress/reports/

param(
    [ValidateSet("all","warmup","normal","peak")]
    [string]$Phase = "all",

    [string]$Target = "https://nailsco-backend.fly.dev",

    [switch]$Report
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunScript = Join-Path $ScriptDir "run-stress.js"

if (-not (Test-Path $RunScript)) {
    Write-Error "No se encontro run-stress.js en $ScriptDir"
    exit 1
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Nails & Co — Stress Test" -ForegroundColor Cyan
Write-Host "  Target  : $Target" -ForegroundColor Cyan
Write-Host "  Phase   : $Phase" -ForegroundColor Cyan
if ($Report) {
    Write-Host "  Report  : reports/stress-report_<timestamp>.json+html" -ForegroundColor Cyan
}
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$env:BASE_URL = $Target

$reportFlag = if ($Report) { "--report" } else { "" }

if ($reportFlag) {
    node $RunScript --phase $Phase --report
} else {
    node $RunScript --phase $Phase
}

$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "  Resultado: PASSED" -ForegroundColor Green
} else {
    Write-Host "  Resultado: SLO violations encontradas (ver reporte arriba)" -ForegroundColor Yellow
}
if ($Report) {
    $reportsDir = Join-Path $ScriptDir "reports"
    Write-Host "  Reportes: $reportsDir" -ForegroundColor Cyan
}

exit $exitCode
