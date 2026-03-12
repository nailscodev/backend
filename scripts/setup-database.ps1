# Script para configurar la base de datos PostgreSQL
Write-Host "Configurando base de datos..." -ForegroundColor Cyan

# Usar autenticación sin password (configuración actual)
$env:PGPASSWORD = $null

# Ruta de PostgreSQL
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Verificar que psql existe
if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: No se encuentra PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL encontrado" -ForegroundColor Green

# Rutas a los scripts SQL (relativas a este script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbDir = Join-Path $scriptDir "..\database"

# Paso 1: Reset de base de datos
Write-Host "Paso 1: Reseteando base de datos..." -ForegroundColor Yellow
& $psqlPath -U postgres -f "$dbDir\reset-database.sql"

# Paso 2: Crear tablas
Write-Host "Paso 2: Creando tablas..." -ForegroundColor Yellow
& $psqlPath -U postgres -d nailsandco -f "$dbDir\create-tables.sql"

# Paso 3: Cargar datos
Write-Host "Paso 3: Cargando datos..." -ForegroundColor Yellow
& $psqlPath -U postgres -d nailsandco -f "$dbDir\load-sample-data.sql"

Write-Host "Base de datos configurada!" -ForegroundColor Green
