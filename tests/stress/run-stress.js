#!/usr/bin/env node
/**
 * Nails & Co — Stress Test Runner (Node.js / axios)
 *
 * Usage:
 *   node run-stress.js
 *   node run-stress.js --phase peak
 *   node run-stress.js --report
 *   node run-stress.js --phase peak --report
 *   BASE_URL=http://localhost:3001 node run-stress.js
 *
 * Phases:  warmup (5rps/20s) | normal (15rps/30s) | peak (30rps/20s) | all
 * Reports: saved to tests/stress/reports/ as JSON + HTML when --report is used
 */

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

const BASE_URL = process.env.BASE_URL || 'https://nailsco-backend.fly.dev';
const PHASE_ARG = (() => {
  const flagIdx = process.argv.indexOf('--phase');
  if (flagIdx !== -1 && process.argv[flagIdx + 1]) return process.argv[flagIdx + 1];
  const eqFlag = process.argv.find(a => a.startsWith('--phase='));
  if (eqFlag) return eqFlag.split('=')[1];
  return 'all';
})();

const SAVE_REPORT = process.argv.includes('--report') || process.env.STRESS_REPORT === '1';

// ─── Endpoints to hit ───────────────────────────────────────────────────────
const REQUESTS = [
  { method: 'GET', path: '/api/v1/services',  label: 'GET /services' },
  { method: 'GET', path: '/api/v1/staff',     label: 'GET /staff' },
  { method: 'GET', path: '/api/v1/categories', label: 'GET /categories' },
  { method: 'GET', path: '/api/v1/health',    label: 'GET /health' },
  {
    method: 'GET',
    // correct endpoint: /bookings/available-slots  (staffId is optional UUID)
    path: '/api/v1/bookings/available-slots?date=2026-04-15&staffId=20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301',
    label: 'GET /available-slots',
  },
  {
    method: 'POST',
    path: '/api/v1/bookings',
    label: 'POST /bookings',
    body: {
      serviceId:       'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501',
      staffId:         '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301',
      customerId:      '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301',
      appointmentDate: '2026-04-15',
      startTime:       '11:00:00',
      endTime:         '11:30:00',
    },
    // 400/409 conflict is expected under load — not counted as error
    acceptedStatuses: [201, 400, 409, 422],
  },
];

// ─── Stats accumulator ──────────────────────────────────────────────────────
const stats = {};
let testStartTime = 0;
let testEndTime   = 0;

function initStat(label) {
  if (!stats[label]) stats[label] = { ok: 0, error: 0, latencies: [] };
}
function recordResult(label, latencyMs, ok) {
  initStat(label);
  stats[label].latencies.push(latencyMs);
  ok ? stats[label].ok++ : stats[label].error++;
}

// ─── Single request ─────────────────────────────────────────────────────────
async function fire(req) {
  const start = Date.now();
  try {
    const resp = await axios({
      method: req.method,
      url:    BASE_URL + req.path,
      data:   req.body,
      timeout: 10000,
      validateStatus: () => true, // don't throw on 4xx/5xx
    });
    const latency = Date.now() - start;
    const accepted = req.acceptedStatuses || [200, 201];
    const ok = accepted.includes(resp.status);
    recordResult(req.label, latency, ok);
    if (!ok) {
      process.stdout.write(`\n  [FAIL] ${req.label} → HTTP ${resp.status}`);
    }
  } catch (err) {
    const latency = Date.now() - start;
    recordResult(req.label, latency, false);
    process.stdout.write(`\n  [ERR]  ${req.label} → ${err.message}`);
  }
}

// ─── Phase runner ───────────────────────────────────────────────────────────
async function runPhase(name, rps, durationSec) {
  console.log(`\n🔥 Phase: ${name.toUpperCase()} — ${rps} rps × ${durationSec}s`);
  const intervalMs = 1000 / rps;
  const endAt      = Date.now() + durationSec * 1000;
  const pending    = [];
  let   tick       = 0;

  while (Date.now() < endAt) {
    const req = REQUESTS[tick % REQUESTS.length];
    pending.push(fire(req));
    tick++;
    process.stdout.write('.');
    await sleep(intervalMs);
  }

  // Drain
  await Promise.allSettled(pending);
  console.log(' done.');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, Math.max(0, ms)));
}

// ─── Build per-endpoint summary ────────────────────────────────────────────
function buildSummary() {
  const timestamp = new Date().toISOString();
  let totalOk = 0, totalErr = 0, totalReqs = 0;
  const endpoints = [];
  const sloErrors = [];

  for (const [label, s] of Object.entries(stats)) {
    const lat = [...s.latencies].sort((a, b) => a - b);
    const n   = lat.length;
    if (n === 0) continue;

    const p50    = lat[Math.floor(n * 0.50)] ?? 0;
    const p95    = lat[Math.floor(n * 0.95)] ?? 0;
    const p99    = lat[Math.floor(n * 0.99)] ?? 0;
    const avg    = Math.round(lat.reduce((a, b) => a + b, 0) / n);
    const min    = lat[0];
    const max    = lat[n - 1];
    const errPct = parseFloat(((s.error / n) * 100).toFixed(1));

    endpoints.push({ label, requests: n, ok: s.ok, errors: s.error, errorPct: errPct, avg, min, max, p50, p95, p99 });

    totalOk    += s.ok;
    totalErr   += s.error;
    totalReqs  += n;

    if (p95 > 1500)     sloErrors.push(`${label}: p95=${p95}ms > 1500ms`);
    if (errPct > 5)     sloErrors.push(`${label}: error rate ${errPct}% > 5%`);
  }

  const overallErrPct = totalReqs > 0 ? parseFloat(((totalErr / totalReqs) * 100).toFixed(1)) : 0;
  const passed = sloErrors.length === 0;

  // Throughput: actual measured req/s over the whole test wall-clock time
  const durationSec  = testEndTime > testStartTime ? (testEndTime - testStartTime) / 1000 : 1;
  const throughputRps = parseFloat((totalReqs / durationSec).toFixed(2));

  // Attach per-endpoint throughput (rough: endpoint_reqs / total_duration)
  for (const ep of endpoints) {
    ep.rps = parseFloat((ep.requests / durationSec).toFixed(2));
  }

  return { timestamp, target: BASE_URL, phase: PHASE_ARG, passed, durationSec: parseFloat(durationSec.toFixed(1)), throughputRps, endpoints, totalRequests: totalReqs, totalOk, totalErrors: totalErr, overallErrorPct: overallErrPct, sloErrors };
}

// ─── Console report ──────────────────────────────────────────────────────────
function printReport(summary) {
  console.log('\n\n══════════════════════════════════════════════════');
  console.log('  STRESS TEST REPORT — ' + summary.timestamp);
  console.log('  Target: ' + summary.target);
  console.log('══════════════════════════════════════════════════\n');

  for (const e of summary.endpoints) {
    const icon = e.errors === 0 ? '✅' : e.errorPct < 5 ? '⚠️ ' : '❌';
    console.log(`  ${icon}  ${e.label}`);
    console.log(`       requests: ${e.requests}  ok: ${e.ok}  errors: ${e.errors} (${e.errorPct}%)  throughput: ${e.rps} req/s`);
    console.log(`       latency  — min: ${e.min}ms  avg: ${e.avg}ms  p50: ${e.p50}ms  p95: ${e.p95}ms  p99: ${e.p99}ms  max: ${e.max}ms`);
    console.log();
  }

  console.log('──────────────────────────────────────────────────');
  console.log(`  TOTAL: ${summary.totalRequests} requests  errors: ${summary.totalErrors} (${summary.overallErrorPct}%)`);
  console.log(`  SPEED: ${summary.throughputRps} req/s  (${summary.durationSec}s test duration)`);

  if (summary.passed) {
    console.log('\n  ✅  All SLOs passed (p95 < 1500ms, error rate < 5%)');
  } else {
    console.log('\n  ❌  SLO violations:');
    summary.sloErrors.forEach(e => console.log('     › ' + e));
  }

  console.log('══════════════════════════════════════════════════\n');
}

// ─── Save JSON report ────────────────────────────────────────────────────────
function saveJsonReport(summary) {
  const dir = path.join(__dirname, 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts   = summary.timestamp.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const file = path.join(dir, `stress-report_${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`  📄 JSON report saved → ${file}`);
  return file;
}

// ─── Save HTML report ────────────────────────────────────────────────────────
function saveHtmlReport(summary) {
  const dir = path.join(__dirname, 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts   = summary.timestamp.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const file = path.join(dir, `stress-report_${ts}.html`);

  const statusBadge = summary.passed
    ? '<span style="background:#16a34a;color:#fff;padding:4px 12px;border-radius:6px;font-weight:700">PASSED ✅</span>'
    : '<span style="background:#dc2626;color:#fff;padding:4px 12px;border-radius:6px;font-weight:700">SLO VIOLATIONS ❌</span>';

  const rows = summary.endpoints.map(e => {
    const color = e.errors === 0 ? '#16a34a' : e.errorPct < 5 ? '#ca8a04' : '#dc2626';
    const p95Color = e.p95 > 1500 ? 'color:#dc2626;font-weight:700' : 'color:#16a34a';
    return `<tr>
      <td style="font-weight:600">${e.label}</td>
      <td>${e.requests}</td>
      <td style="color:#0369a1">${e.rps} req/s</td>
      <td style="color:${color}">${e.ok} / ${e.errors} (${e.errorPct}%)</td>
      <td>${e.min}ms</td>
      <td>${e.avg}ms</td>
      <td>${e.p50}ms</td>
      <td style="${p95Color}">${e.p95}ms</td>
      <td>${e.p99}ms</td>
      <td>${e.max}ms</td>
    </tr>`;
  }).join('\n');

  const violations = summary.sloErrors.length === 0
    ? '<p style="color:#16a34a">✅ No SLO violations</p>'
    : '<ul>' + summary.sloErrors.map(v => `<li style="color:#dc2626">${v}</li>`).join('') + '</ul>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stress Test Report — ${summary.timestamp}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 40px auto; color: #1e293b; }
    h1   { font-size: 1.5rem; margin-bottom: 4px; }
    p.meta { color: #64748b; font-size: .9rem; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th    { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; }
    td    { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:hover td { background: #f8fafc; }
    .summary { display: flex; gap: 24px; margin: 24px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; }
    .card h3 { margin: 0 0 4px; font-size: .8rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .card p  { margin: 0; font-size: 1.6rem; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Nails &amp; Co — Stress Test Report</h1>
  <p class="meta">
    ${summary.timestamp} &nbsp;|&nbsp; Target: <strong>${summary.target}</strong> &nbsp;|&nbsp; Phase: <strong>${summary.phase}</strong>
    &nbsp;&nbsp; ${statusBadge}
  </p>
  <div class="summary">
    <div class="card"><h3>Total Requests</h3><p>${summary.totalRequests}</p></div>
    <div class="card"><h3>Errors</h3><p style="color:${summary.totalErrors === 0 ? '#16a34a' : '#dc2626'}">${summary.totalErrors} (${summary.overallErrorPct}%)</p></div>
    <div class="card"><h3>Throughput</h3><p style="color:#0369a1">${summary.throughputRps} req/s</p></div>
    <div class="card"><h3>Duration</h3><p>${summary.durationSec}s</p></div>
    <div class="card"><h3>SLO Violations</h3><p style="color:${summary.sloErrors.length === 0 ? '#16a34a' : '#dc2626'}">${summary.sloErrors.length}</p></div>
  </div>
  <table>
    <thead><tr><th>Endpoint</th><th>Requests</th><th>Throughput</th><th>Ok / Errors</th><th>Min</th><th>Avg</th><th>p50</th><th>p95 (SLO&lt;1500ms)</th><th>p99</th><th>Max</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2 style="margin-top:32px">SLO Check</h2>
  ${violations}
  <p style="color:#94a3b8;font-size:.8rem;margin-top:40px">Generated by run-stress.js</p>
</body>
</html>`;

  fs.writeFileSync(file, html, 'utf8');
  console.log(`  🌐 HTML report saved → ${file}`);
  return file;
}

// ─── Report entry point ──────────────────────────────────────────────────────
function generateReport() {
  const summary = buildSummary();
  printReport(summary);

  if (SAVE_REPORT) {
    console.log();
    saveJsonReport(summary);
    saveHtmlReport(summary);
  }

  console.log();
  process.exit(summary.passed ? 0 : 1);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  Nails & Co — Stress Test Runner');
  console.log(`  Target  : ${BASE_URL}`);
  console.log(`  Phase   : ${PHASE_ARG}`);
  console.log('══════════════════════════════════════════════════');

  // Verify backend is reachable before stressing
  try {
    console.log('\nChecking backend health...');
    const r = await axios.get(`${BASE_URL}/api/v1/health`, { timeout: 10000 });
    console.log(`  ✅  Backend is up — status: ${r.status}, env: ${r.data?.data?.environment || '?'}`);
  } catch (e) {
    console.error(`  ❌  Backend unreachable: ${e.message}`);
    process.exit(1);
  }

  const phases = {
    warmup: [{ name: 'warm-up',  rps: 5,  dur: 20 }],
    normal: [{ name: 'normal',   rps: 15, dur: 30 }],
    peak:   [{ name: 'peak',     rps: 30, dur: 20 }],
    all: [
      { name: 'warm-up', rps: 5,  dur: 20 },
      { name: 'normal',  rps: 15, dur: 30 },
      { name: 'peak',    rps: 30, dur: 20 },
    ],
  };

  const selected = phases[PHASE_ARG] || phases.all;

  testStartTime = Date.now();

  for (const { name, rps, dur } of selected) {
    await runPhase(name, rps, dur);
  }

  testEndTime = Date.now();

  generateReport();
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
