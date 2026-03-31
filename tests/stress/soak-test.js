/**
 * k6 Soak Test — Nails & Co. Backend
 *
 * Objective: Detect memory leaks, connection pool exhaustion, or gradual
 * performance degradation when running at steady load for an EXTENDED period.
 *
 * Profile:
 *    0 → 10 VUs  over 30s   (warm-up)
 *   10 VUs        for 10min  (steady — the soak period)
 *   10 → 0 VUs   over 30s   (cool-down)
 *   Total: ~11 minutes
 *
 * What we look for:
 *   - Does p95 creep up over time (memory leak / DB connection leak)?
 *   - Does error rate increase after 5–10 minutes?
 *   - Does the system slow down even with the same number of VUs?
 *   - Are there any GC pauses visible in latency spikes?
 *
 * Thresholds:
 *   p95 < 1000ms at ALL times (not just at start)
 *   Error rate < 1%
 *   Note: drift detection (last-20% vs first-20% latency) requires
 *         post-processing of --out json output; it is not enforced here.
 *
 * Run:
 *   k6 run soak-test.js
 *   k6 run soak-test.js --env BASE_URL=https://api.nailsandcobeauty.com
 *   k6 run soak-test.js --env DURATION=5m  (shorter soak for CI)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const errorCount  = new Counter('errors');
const errorRate   = new Rate('error_rate');
const reqDuration = new Trend('req_duration_soak', true);

const BASE_URL = __ENV.BASE_URL || 'https://nailsco-backend.fly.dev';
const SOAK_DURATION = __ENV.DURATION || '10m';

export const options = {
  stages: [
    { duration: '30s',         target: 10 }, // Warm-up ramp
    { duration: SOAK_DURATION, target: 10 }, // Soak — look for drift
    { duration: '30s',         target: 0  }, // Cool-down
  ],
  thresholds: {
    // Strict — if the system is healthy, p95 should stay under 1s for the whole duration
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    error_rate: ['rate<0.01'],
    req_duration_soak: ['p(95)<1000'],
  },
};

export default function () {
  // Cycle through endpoints to spread DB load evenly
  const paths = [
    '/api/v1/health',
    '/api/v1/services/list',
    '/api/v1/addons?page=1&limit=20',
    '/api/v1/categories',
    '/api/v1/services',           // replaces /staff/available (requires auth)
  ];

  const path = paths[__ITER % paths.length];
  const res = http.get(`${BASE_URL}${path}`);

  reqDuration.add(res.timings.duration);

  const ok = check(res, {
    '2xx response': (r) => r.status >= 200 && r.status < 300,
    'fast enough': (r) => r.timings.duration < 2000,
  });

  if (!ok) {
    errorCount.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Realistic think time: 0.5–1.5s between requests per VU
  sleep(0.5 + Math.random());
}

export function handleSummary(data) {
  const p95 = data.metrics.req_duration_soak?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  const p99 = data.metrics.req_duration_soak?.values?.['p(99)']?.toFixed(0) ?? 'N/A';
  const errPct = ((data.metrics.error_rate?.values?.rate ?? 0) * 100).toFixed(2);
  const total = data.metrics.http_reqs?.values?.count ?? 0;

  console.log(`Soak completed: ${total} requests | p95=${p95}ms p99=${p99}ms | errors=${errPct}%`);
  return { 'reports/soak-test-summary.json': JSON.stringify(data, null, 2) };
}
