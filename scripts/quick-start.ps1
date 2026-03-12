Write-Host "Nails & Beauty Co - Setup" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta
Write-Host ""
Write-Host "CREDENCIALES DE PRUEBA:" -ForegroundColor Yellow
Write-Host "Admin: admin@nailsco.com / admin123" -ForegroundColor Cyan
Write-Host "Manager: manager@nailsco.com / manager123" -ForegroundColor Cyan
Write-Host "Recepcion: recepcion@nailsco.com / recep123" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Que deseas hacer? [1] Backend [2] Frontend [3] Ambos [4] Configurar BD"

# This script lives in backend/scripts/ — project root is two levels up
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Split-Path -Parent $scriptPath
$projectRoot = Split-Path -Parent $backendPath

function Start-Window {
    param([string]$Title, [string]$Path, [string]$Script)
    Write-Host "Iniciando $Title..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; .\$Script"
}

function Setup-Database {
    Write-Host "Configurando base de datos..." -ForegroundColor Green
    & "$scriptPath\setup-database.ps1"
}

switch ($choice) {
    "1" { Start-Window "Backend" "$backendPath" "dev-setup-simple.ps1" }
    "2" { Start-Window "Frontend" "$projectRoot\frontend-web" "dev-setup-simple.ps1" }
    "3" { 
        Start-Window "Backend" "$backendPath" "dev-setup-simple.ps1"
        Start-Sleep -Seconds 2
        Start-Window "Frontend" "$projectRoot\frontend-web" "dev-setup-simple.ps1"
        Write-Host "Aplicacion iniciada!" -ForegroundColor Green
    }
    "4" { Setup-Database }
    default { Write-Host "Opcion no valida" -ForegroundColor Red }
}
