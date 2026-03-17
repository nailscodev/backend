/**
 * k6 Load Test — Nails & Co. Backend
 *
 * Objective: Validate that the backend handles EXPECTED traffic without degradation.
 *
 * Profile:
 *   0 → 10 VUs  over 10s  (warm-up ramp)
 *   10 VUs       for 30s  (steady load — typical weekday peak)
 *   10 → 0 VUs  over 10s  (ramp-down)
 *   Total: ~50 seconds
 *
 * Thresholds (pass/fail criteria):
 *   p95 response time < 800ms
 *   Error rate        < 1%
 *   p99 response time < 2000ms
 *
 * Run:
 *   k6 run load-test.js
 *   k6 run load-test.js --env BASE_URL=https://api.nailsandcobeauty.com
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ─────────────────────────────────────────────────────────
const errorCount   = new Counter('errors');
const errorRate    = new Rate('error_rate');
const servicesTime = new Trend('services_response_time', true);
  const staffTime    = new Trend('categories_response_time', true);
const addonsTime   = new Trend('addons_response_time', true);
const healthTime   = new Trend('health_response_time', true);

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://nailsco-backend.fly.dev';

// ─── Test scenario ───────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp-up: 0 → 10 VUs
    { duration: '30s', target: 10 }, // Steady:  10 VUs
    { duration: '10s', target: 0  }, // Ramp-down: 10 → 0
  ],
  thresholds: {
    // 95th percentile must be under 800ms
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    // Error rate must be below 1%
    error_rate: ['rate<0.01'],
    // Per-endpoint thresholds
    services_response_time:    ['p(95)<1000'],
    categories_response_time:  ['p(95)<1000'],
    addons_response_time:      ['p(95)<800'],
    health_response_time:   ['p(95)<200'],
  },
};

// ─── Main VU function ────────────────────────────────────────────────────────
export default function () {
  // 1) Health check — baseline
  {
    const res = http.get(`${BASE_URL}/api/v1/health`);
    healthTime.add(res.timings.duration);
    const ok = check(res, { 'health: status 200': (r) => r.status === 200 });
    if (!ok) { errorCount.add(1); errorRate.add(1); } else { errorRate.add(0); }
  }

  sleep(0.1);

  // 2) Services list — popular booking page load
  {
    const res = http.get(`${BASE_URL}/api/v1/services/list`);
    servicesTime.add(res.timings.duration);
    const ok = check(res, { 'services: status 200': (r) => r.status === 200 });
    if (!ok) { errorCount.add(1); errorRate.add(1); } else { errorRate.add(0); }
  }

  sleep(0.1);

  // 3) Categories — public endpoint, no auth required
  {
    const res = http.get(`${BASE_URL}/api/v1/categories`);
    staffTime.add(res.timings.duration);
    const ok = check(res, { 'categories: status 200': (r) => r.status === 200 });
    if (!ok) { errorCount.add(1); errorRate.add(1); } else { errorRate.add(0); }
  }

  sleep(0.1);

  // 4) Addons — shown on booking flow
  {
    const res = http.get(`${BASE_URL}/api/v1/addons?page=1&limit=20`);
    addonsTime.add(res.timings.duration);
    const ok = check(res, { 'addons: status 200': (r) => r.status === 200 });
    if (!ok) { errorCount.add(1); errorRate.add(1); } else { errorRate.add(0); }
  }

  // Think time: simulate user reading the page (0.3–1s between iterations)
  sleep(0.3 + Math.random() * 0.7);
}

export function handleSummary(data) {
  return {
    'reports/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const p95 = m.http_req_duration?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  const p99 = m.http_req_duration?.values?.['p(99)']?.toFixed(0) ?? 'N/A';
  const rps = m.http_reqs?.values?.rate?.toFixed(1) ?? 'N/A';
  const errPct = ((m.error_rate?.values?.rate ?? 0) * 100).toFixed(2);
  return `
╔═══════════════════════════════════════╗
║       LOAD TEST SUMMARY               ║
╠═══════════════════════════════════════╣
║  Total Requests   : ${String(m.http_reqs?.values?.count ?? 0).padEnd(15)}  ║
║  Requests/sec     : ${String(rps).padEnd(15)}  ║
║  p95 Latency      : ${String(p95 + 'ms').padEnd(15)}  ║
║  p99 Latency      : ${String(p99 + 'ms').padEnd(15)}  ║
║  Error Rate       : ${String(errPct + '%').padEnd(15)}  ║
╚═══════════════════════════════════════╝
`;
}
