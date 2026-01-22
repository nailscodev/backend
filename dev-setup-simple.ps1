Write-Host "Backend Setup - Nails & Beauty Co" -ForegroundColor Cyan
Write-Host "Directorio: $(Get-Location)"
Write-Host ""

if (!(Test-Path "package.json")) {
    Write-Host "Error: No se encontro package.json" -ForegroundColor Red
    exit 1
}

Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host "Iniciando servidor..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:3001/api/docs" -ForegroundColor Cyan
npm run start:dev