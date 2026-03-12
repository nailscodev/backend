# Script de Verificacion - Nails & Beauty Co
# Verifica que todo este configurado correctamente

Write-Host "Nails & Beauty Co - Verificacion del Sistema" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$allGood = $true
$parentPath = Split-Path (Get-Location) -Parent

# Verificar Node.js
Write-Host ""
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "   Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Node.js no esta instalado" -ForegroundColor Red
    $allGood = $false
}

# Verificar npm
Write-Host ""
Write-Host "Verificando npm..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "   npm instalado: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: npm no esta instalado" -ForegroundColor Red
    $allGood = $false
}

# Verificar PostgreSQL
Write-Host ""
Write-Host "Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $pgProcess = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
    if ($pgProcess) {
        Write-Host "   PostgreSQL esta corriendo" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: PostgreSQL no esta corriendo" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   No se pudo verificar PostgreSQL" -ForegroundColor Yellow
}

# Verificar dependencias del backend
Write-Host ""
Write-Host "Verificando dependencias del backend..." -ForegroundColor Yellow
if (Test-Path "$parentPath/backend/node_modules") {
    Write-Host "   Dependencias del backend instaladas" -ForegroundColor Green
} else {
    Write-Host "   ADVERTENCIA: Dependencias del backend no instaladas" -ForegroundColor Yellow
    Write-Host "   Ejecuta: cd backend && npm install" -ForegroundColor Cyan
}

# Verificar dependencias del frontend
Write-Host ""
Write-Host "Verificando dependencias del frontend..." -ForegroundColor Yellow
if (Test-Path "$parentPath/frontend/node_modules") {
    Write-Host "   Dependencias del frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "   ADVERTENCIA: Dependencias del frontend no instaladas" -ForegroundColor Yellow
    Write-Host "   Ejecuta: cd frontend && npm install" -ForegroundColor Cyan
}

# Verificar archivos de configuracion
Write-Host ""
Write-Host "Verificando configuracion..." -ForegroundColor Yellow
if (Test-Path "$parentPath/backend/.env") {
    Write-Host "   Archivo .env del backend existe" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Archivo .env del backend no existe" -ForegroundColor Red
    $allGood = $false
}

# Resumen
Write-Host ""
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "Sistema listo para desarrollo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pasos siguientes:" -ForegroundColor Yellow
    Write-Host "   1. Ejecuta: .\quick-start.ps1" -ForegroundColor White
    Write-Host "   2. Selecciona opcion 3 (Backend + Frontend)" -ForegroundColor White
    Write-Host "   3. Accede a http://localhost:3001" -ForegroundColor White
} else {
    Write-Host "Algunos componentes necesitan atencion" -ForegroundColor Red
    Write-Host "   Revisa los mensajes de arriba y corrige los problemas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "URLs importantes:" -ForegroundColor Yellow
Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:5000/api/docs" -ForegroundColor White
Write-Host ""