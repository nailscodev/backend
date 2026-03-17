/**
 * k6 Stress Test — Nails & Co. Backend
 *
 * Objective: Find the MAXIMUM capacity of the backend by pushing VUs
 * until performance degrades or errors appear.
 *
 * Profile:
 *    1 VU  for 5s  (baseline sanity check)
 *    5 VUs for 10s
 *   10 VUs for 10s
 *   20 VUs for 10s
 *   30 VUs for 10s
 *   50 VUs for 10s  (expected breaking point)
 *   0 VUs for 5s    (cool-down — measures recovery)
 *   Total: ~60 seconds
 *
 * Thresholds: intentionally lenient — we're looking for the LIMIT, not failing fast.
 *   Error rate < 20% overall
 *   p95 < 5000ms
 *
 * Run:
 *   k6 run stress-test.js
 *   k6 run stress-test.js --env BASE_URL=https://api.nailsandcobeauty.com
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const errorCount = new Counter('errors');
const errorRate  = new Rate('error_rate');
const latency    = new Trend('endpoint_latency', true);

const BASE_URL = __ENV.BASE_URL || 'https://nailsco-backend.fly.dev';

export const options = {
  stages: [
    { duration: '5s',  target: 1  }, // Sanity baseline
    { duration: '10s', target: 5  }, // Warm-up
    { duration: '10s', target: 10 }, // Low stress
    { duration: '10s', target: 20 }, // Medium stress
    { duration: '10s', target: 30 }, // High stress
    { duration: '10s', target: 50 }, // Peak stress — find the limit
    { duration: '5s',  target: 0  }, // Cool-down — check recovery
  ],
  thresholds: {
    // Lenient — stress test is about measuring degradation, not failing CI
    http_req_duration: ['p(95)<5000'],
    error_rate: ['rate<0.20'],
  },
};

const ENDPOINTS = [
  '/api/v1/health',
  '/api/v1/services/list',
  '/api/v1/categories',          // replaces /staff/available (requires auth)
  '/api/v1/addons?page=1&limit=20',
];

export default function () {
  // Each VU hits all endpoints in sequence to simulate a real booking flow
  for (const path of ENDPOINTS) {
    const res = http.get(`${BASE_URL}${path}`);
    latency.add(res.timings.duration);

    const ok = check(res, {
      [`${path}: 2xx`]: (r) => r.status >= 200 && r.status < 300,
    });

    if (!ok) {
      errorCount.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    sleep(0.05);
  }

  // Minimal think time at high VU counts to keep pressure up
  sleep(0.1 + Math.random() * 0.3);
}

export function handleSummary(data) {
  return { 'reports/stress-test-summary.json': JSON.stringify(data, null, 2) };
}
