/**
 * k6 Spike Test — Nails & Co. Backend
 *
 * Objective: Test how the backend handles a SUDDEN large increase in traffic.
 * Simulates scenarios like: a social media post goes viral, a flash sale starts,
 * or a news feature causes a surge in bookings.
 *
 * Profile:
 *    2 VUs for 10s  (normal quiet traffic)
 *   50 VUs for 15s  (sudden spike — 25x increase in 1 second!)
 *    2 VUs for 15s  (recovery — does the system return to normal?)
 *   Total: ~40 seconds
 *
 * What we look for:
 *   - How quickly does p95 latency spike?
 *   - Does the error rate stay low during and after the spike?
 *   - Does the system RECOVER after the spike (p95 drops back to normal)?
 *
 * Run:
 *   k6 run spike-test.js
 *   k6 run spike-test.js --env BASE_URL=https://api.nailsandcobeauty.com
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const errorCount      = new Counter('errors');
const errorRate       = new Rate('error_rate');
const latencyDurSpike = new Trend('latency_during_spike', true);
const latencyBase     = new Trend('latency_baseline', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  stages: [
    { duration: '10s', target: 2  }, // Normal traffic baseline
    { duration: '1s',  target: 50 }, // Instant spike! (intentionally 1s, not gradual)
    { duration: '14s', target: 50 }, // Hold at spike level
    { duration: '1s',  target: 2  }, // Drop back instantly
    { duration: '14s', target: 2  }, // Monitor recovery
  ],
  thresholds: {
    // During spike we accept higher latency, but system must recover
    http_req_duration: ['p(95)<3000'],
    error_rate: ['rate<0.10'], // Max 10% error rate (spike is harder)
  },
};

export default function () {
  // Determine if we're in the spike window based on __VU and __ITER
  const isSpike = __VU > 2; // VUs > 2 means we're in the spike

  const endpoints = isSpike
    ? ['/api/v1/services/list', '/api/v1/staff/available'] // Heavy endpoints during spike
    : ['/api/v1/health', '/api/v1/services/list'];          // Lighter load at baseline

  for (const path of endpoints) {
    const res = http.get(`${BASE_URL}${path}`);

    if (isSpike) {
      latencyDurSpike.add(res.timings.duration);
    } else {
      latencyBase.add(res.timings.duration);
    }

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

  sleep(0.1 + Math.random() * 0.2);
}

export function handleSummary(data) {
  const spikeP95 = data.metrics.latency_during_spike?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  const baseP95  = data.metrics.latency_baseline?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  console.log(`Spike p95: ${spikeP95}ms | Baseline p95: ${baseP95}ms`);
  return { 'reports/spike-test-summary.json': JSON.stringify(data, null, 2) };
}
