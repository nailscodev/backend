# Scripts de Verificacion Pre-Deployment
# Este script verifica que todo este listo para el deployment

# This script lives in backend/scripts/ — navigate to project root (two levels up)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
Set-Location $projectRoot

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "   VERIFICACION PRE-DEPLOYMENT - Nails & Beauty Co" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Directorio: $projectRoot" -ForegroundColor Gray
Write-Host ""

$allGood = $true

# Funcion para verificar archivo
function Test-FileExists {
    param($Path, $Description)
    if (Test-Path $Path) {
        Write-Host "[OK] $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[X] $Description - NO ENCONTRADO" -ForegroundColor Red
        return $false
    }
}

# Verificar archivos de configuracion del Backend
Write-Host "BACKEND - Archivos de configuracion:" -ForegroundColor Yellow
$allGood = (Test-FileExists "backend/Procfile" "Procfile") -and $allGood
$allGood = (Test-FileExists "backend/render.yaml" "render.yaml") -and $allGood
$allGood = (Test-FileExists "backend/.env.example" ".env.example") -and $allGood
$allGood = (Test-FileExists "backend/package.json" "package.json") -and $allGood
$allGood = (Test-FileExists "backend/tsconfig.json" "tsconfig.json") -and $allGood
Write-Host ""

# Verificar archivos de configuracion del Frontend
Write-Host "FRONTEND - Archivos de configuracion:" -ForegroundColor Yellow
$allGood = (Test-FileExists "frontend-web/vercel.json" "vercel.json") -and $allGood
$allGood = (Test-FileExists "frontend-web/.env.example" ".env.example") -and $allGood
$allGood = (Test-FileExists "frontend-web/package.json" "package.json") -and $allGood
$allGood = (Test-FileExists "frontend-web/next.config.mjs" "next.config.mjs") -and $allGood
Write-Host ""

# Verificar scripts SQL
Write-Host "BASE DE DATOS - Scripts SQL:" -ForegroundColor Yellow
$allGood = (Test-FileExists "backend/database/create-tables.sql" "create-tables.sql") -and $allGood
$allGood = (Test-FileExists "backend/database/load-sample-data.sql" "load-sample-data.sql") -and $allGood
$allGood = (Test-FileExists "backend/database/reset-database.sql" "reset-database.sql") -and $allGood
Write-Host ""

# Verificar documentacion
Write-Host "DOCUMENTACION:" -ForegroundColor Yellow
$allGood = (Test-FileExists "DEPLOYMENT_GUIDE.md" "DEPLOYMENT_GUIDE.md") -and $allGood
Write-Host ""

# Verificar que .env no este en el repo
Write-Host "SEGURIDAD - Verificar archivos sensibles:" -ForegroundColor Yellow
if (-not (Test-Path "backend/.env")) {
    Write-Host "[OK] backend/.env NO esta presente (correcto)" -ForegroundColor Green
} else {
    Write-Host "[!] backend/.env ENCONTRADO - Asegurate de que este en .gitignore" -ForegroundColor Yellow
}

if (-not (Test-Path "frontend-web/.env")) {
    Write-Host "[OK] frontend-web/.env NO esta presente (correcto)" -ForegroundColor Green
} else {
    Write-Host "[!] frontend-web/.env ENCONTRADO - Asegurate de que este en .gitignore" -ForegroundColor Yellow
}
Write-Host ""

# Verificar dependencias del Backend
Write-Host "BACKEND - Verificando build:" -ForegroundColor Yellow
Push-Location backend
try {
    if (Test-Path "node_modules") {
        Write-Host "[OK] node_modules presente" -ForegroundColor Green
    } else {
        Write-Host "[!] node_modules NO encontrado - Ejecuta: npm install" -ForegroundColor Yellow
        $allGood = $false
    }
    
    Write-Host "Intentando build del backend..." -ForegroundColor Cyan
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Build del backend exitoso" -ForegroundColor Green
    } else {
        Write-Host "[X] Build del backend FALLO" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        $allGood = $false
    }
} finally {
    Pop-Location
}
Write-Host ""

# Verificar dependencias del Frontend
Write-Host "FRONTEND - Verificando build:" -ForegroundColor Yellow
Push-Location frontend-web
try {
    if (Test-Path "node_modules") {
        Write-Host "[OK] node_modules presente" -ForegroundColor Green
    } else {
        Write-Host "[!] node_modules NO encontrado - Ejecuta: npm install" -ForegroundColor Yellow
        $allGood = $false
    }
    
    Write-Host "Intentando build del frontend..." -ForegroundColor Cyan
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Build del frontend exitoso" -ForegroundColor Green
    } else {
        Write-Host "[X] Build del frontend FALLO" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        $allGood = $false
    }
} finally {
    Pop-Location
}
Write-Host ""

# Verificar estado de Git
Write-Host "GIT - Estado del repositorio:" -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($LASTEXITCODE -eq 0) {
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Host "[OK] No hay cambios sin commitear" -ForegroundColor Green
    } else {
        Write-Host "[!] Hay cambios sin commitear:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Gray
        Write-Host "   Considera hacer commit antes de deployar" -ForegroundColor Yellow
    }
} else {
    Write-Host "[!] No es un repositorio Git o Git no esta instalado" -ForegroundColor Yellow
}
Write-Host ""

# Resumen final
Write-Host "==============================================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "[OK] TODO LISTO PARA DEPLOYMENT" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Genera valores seguros: node backend/scripts/generate-secrets.js" -ForegroundColor White
    Write-Host "2. Sigue la guia: DEPLOYMENT_GUIDE.md" -ForegroundColor White
} else {
    Write-Host "[X] HAY PROBLEMAS QUE RESOLVER" -ForegroundColor Red
    Write-Host "   Revisa los errores anteriores antes de continuar" -ForegroundColor Yellow
}
Write-Host "==============================================================" -ForegroundColor Cyan
