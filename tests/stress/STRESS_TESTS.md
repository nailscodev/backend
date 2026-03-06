# Nails & Co — Stress Tests

Pruebas de carga y estrés contra el backend. El runner está escrito en Node.js con axios (sin dependencias externas de CLI), lo que facilita ejecutarlo en cualquier entorno.

---

## Requisitos

- Node.js ≥ 18
- Desde la carpeta `backend/`: las dependencias de `tests/stress/` se instalan automáticamente con `npm install` desde esa subcarpeta, o el runner usa solo `axios` que ya está en `node_modules`.

---

## Cómo correr (desde la raíz del backend)

```powershell
# Todas las fases: warm-up → normal → peak (default)
npm run stress

# Solo warm-up (5rps × 20s — ligero, para verificar que responde)
npm run stress:warmup

# Solo peak (30rps × 20s — carga máxima)
npm run stress:peak

# Contra localhost (backend local en puerto 3001)
npm run stress:local

# Guardar reporte JSON + HTML en tests/stress/reports/
npm run stress:report

# Peak con reporte
npm run stress:report:peak
```

---

## Cómo correr con el script PowerShell

Desde cualquier directorio:

```powershell
# Todos los parámetros son opcionales
.\tests\stress\stress.ps1

# Solo fase peak
.\tests\stress\stress.ps1 -Phase peak

# Contra local
.\tests\stress\stress.ps1 -Target http://localhost:3001

# Con reporte guardado en tests/stress/reports/
.\tests\stress\stress.ps1 -Report

# Combinado
.\tests\stress\stress.ps1 -Phase peak -Target http://localhost:3001 -Report
```

Parámetros disponibles:

| Parámetro  | Valores                            | Default                             |
|------------|------------------------------------|-------------------------------------|
| `-Phase`   | `all`, `warmup`, `normal`, `peak`  | `all`                               |
| `-Target`  | cualquier URL                      | `https://nailsco-backend.fly.dev`   |
| `-Report`  | switch (no necesita valor)         | desactivado                         |

---

## Cómo correr con node directamente

```powershell
# Contra producción — todas las fases
node tests/stress/run-stress.js

# Fase específica
node tests/stress/run-stress.js --phase peak

# Contra local
$env:BASE_URL="http://localhost:3001"; node tests/stress/run-stress.js

# Con reporte
node tests/stress/run-stress.js --report
node tests/stress/run-stress.js --phase peak --report

# Con env var en lugar del flag
$env:STRESS_REPORT="1"; node tests/stress/run-stress.js
```

---

## Fases de carga

| Fase       | RPS | Duración | Descripción                         |
|------------|-----|----------|-------------------------------------|
| `warmup`   | 5   | 20s      | Calentamiento, verifica que responde |
| `normal`   | 15  | 30s      | Carga típica de un día con actividad |
| `peak`     | 30  | 20s      | Pico máximo (límite del plan Fly.io) |
| `all`      | —   | ~70s     | warmup → normal → peak encadenado   |

> **Nota:** El plan `shared-cpu-1x` / 512MB de Fly.io aguanta bien hasta 30 rps con p50 ~600ms.  
> Para escalar a 60+ rps se necesita `performance-1x` o agregar caché en los endpoints de catálogo.

---

## Endpoints probados

| Endpoint                              | Método | Respuestas aceptadas |
|---------------------------------------|--------|----------------------|
| `/api/v1/services`                    | GET    | 200                  |
| `/api/v1/staff`                       | GET    | 200                  |
| `/api/v1/categories`                  | GET    | 200                  |
| `/api/v1/health`                      | GET    | 200                  |
| `/api/v1/bookings/available-slots`    | GET    | 200                  |
| `/api/v1/bookings`                    | POST   | 201, 400, 409, 422   |

---

## Reportes

Con el flag `--report` (o `-Report` en PowerShell) se guardan dos archivos en `tests/stress/reports/`:

```
tests/stress/reports/
  stress-report_2026-03-06_16-35-00.json   ← datos completos (avg, p50, p95, p99, errors)
  stress-report_2026-03-06_16-35-00.html   ← tabla visual, abrir en el browser
```

Los archivos `reports/` están en `.gitignore` (no se commitean).

---

## SLOs (Service Level Objectives)

El runner reporta violaciones si:

- **p95 > 1500ms** en cualquier endpoint
- **Error rate > 5%** en cualquier endpoint

Exit code `0` = todos los SLOs pasados.  
Exit code `1` = hay violaciones (el servidor siguió respondiendo, solo fue más lento de lo esperado).

---

## Resultados de referencia (Fly.io shared-cpu-1x)

Corrida en **2026-03-06** contra `https://nailsco-backend.fly.dev`:

| Endpoint              | p50    | p95     | Error rate |
|-----------------------|--------|---------|------------|
| GET /services         | 610ms  | 2464ms  | 1.9%       |
| GET /staff            | 590ms  | 1963ms  | 0.6%       |
| GET /available-slots  | 607ms  | 1991ms  | 0.6%       |
| GET /categories       | 582ms  | 1700ms  | 0.6%       |
| GET /health           | 628ms  | 2006ms  | 1.3%       |
| POST /bookings        | 622ms  | 1828ms  | **0.0%**   |

**Total: 956 requests, error rate global 0.8%**

El p95 supera 1500ms bajo carga porque la máquina es `shared-cpu-1x`. El p50 (~600ms) es el indicador más realista de la experiencia del usuario final.
