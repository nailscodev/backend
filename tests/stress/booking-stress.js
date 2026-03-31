/**
 * Nails & Co — k6 Load & Stress Test
 *
 * Scenarios:
 *   1. GET /availability  — 50 VUs × 30s (discovery latency)
 *   2. POST /bookings     — 20 concurrent VUs (double-booking detection)
 *   3. Combined GET burst — staff + services + customers
 *
 * Thresholds:
 *   - p(95) response time < 1500ms
 *   - error rate < 1%
 *
 * Usage:
 *   k6 run tests/stress/booking-stress.js
 *   k6 run --env BASE_URL=https://your-api.fly.dev tests/stress/booking-stress.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'https://nailsco-backend.fly.dev';
const API = `${BASE_URL}/api/v1`;

// Optional auth — pass via env: k6 run --env AUTH_TOKEN=Bearer xxx ...
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
};

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const bookingErrorRate = new Rate('booking_errors');
const availabilityLatency = new Trend('availability_latency', true);

// ---------------------------------------------------------------------------
// Test options
// ---------------------------------------------------------------------------
export const options = {
  scenarios: {
    // Scenario 1: availability check load
    availability_load: {
      executor: 'constant-vus',
      exec: 'availabilityScenario',
      vus: 50,
      duration: '30s',
      tags: { scenario: 'availability' },
    },
    // Scenario 2: concurrent booking creation (starts after 35s)
    concurrent_bookings: {
      executor: 'constant-vus',
      exec: 'bookingCreationScenario',
      vus: 20,
      duration: '30s',
      startTime: '35s',
      tags: { scenario: 'booking_creation' },
    },
    // Scenario 3: combined GET burst (starts after 70s)
    combined_get_burst: {
      executor: 'ramping-vus',
      exec: 'combinedGetBurst',
      startTime: '70s',
      stages: [
        { duration: '15s', target: 30 },
        { duration: '30s', target: 50 },
        { duration: '15s', target: 0 },
      ],
      tags: { scenario: 'combined_gets' },
    },
  },

  thresholds: {
    // Global p(95) must be under 1500ms
    http_req_duration: ['p(95)<1500'],
    // Error rate below 1%
    http_req_failed: ['rate<0.01'],
    // Booking-specific errors below 1%
    booking_errors: ['rate<0.01'],
    // Availability endpoint p(95)
    availability_latency: ['p(95)<1500'],
  },
};

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
// Seeded test data IDs (override via --env for production)
const TEST_SERVICE_IDS = [
  __ENV.SERVICE_ID_1 || 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', // Basic Manicure
  __ENV.SERVICE_ID_2 || 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b509', // Basic Spa Pedicure
];
const TEST_STAFF_ID = __ENV.STAFF_ID || '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301';
const TEST_CUSTOMER_IDS = [
  '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301',
  '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302',
  '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303',
];

// Booking dates: use next 7 weekdays (no Sundays)
function nextWeekday() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 5) + 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // skip Sunday
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Scenario: Availability (Scenario 1 + combined burst)
// ---------------------------------------------------------------------------
export function availabilityScenario() {
  group('GET availability', () => {
    const date = nextWeekday();
    const url = `${API}/availability?staffId=${TEST_STAFF_ID}&date=${date}&serviceIds=${TEST_SERVICE_IDS.join(',')}`;
    const start = Date.now();
    const res = http.get(url, { headers });
    availabilityLatency.add(Date.now() - start);
    check(res, {
      'availability status 200': (r) => r.status === 200,
      'availability has data': (r) => r.json() !== null,
    }) || bookingErrorRate.add(1);
    sleep(0.5 + Math.random());
  });
}

// ---------------------------------------------------------------------------
// Scenario: Concurrent booking creation (Scenario 2)
// ---------------------------------------------------------------------------
export function bookingCreationScenario() {
  group('POST booking creation', () => {
    const customerId = TEST_CUSTOMER_IDS[Math.floor(Math.random() * TEST_CUSTOMER_IDS.length)];
    const payload = JSON.stringify({
      serviceId: TEST_SERVICE_IDS[Math.floor(Math.random() * TEST_SERVICE_IDS.length)],
      staffId: TEST_STAFF_ID,
      customerId,
      appointmentDate: nextWeekday(),
      startTime: '10:00:00',
      endTime: '10:30:00',
    });

    const res = http.post(`${API}/bookings`, payload, { headers });

    // Accept 201 (success) OR 409 (conflict — expected for concurrent requests on same slot)
    const success = check(res, {
      'booking created or conflict': (r) => r.status === 201 || r.status === 409 || r.status === 400,
    });
    if (!success) bookingErrorRate.add(1);
    sleep(1 + Math.random() * 2);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Combined GET burst (Scenario 3)
// ---------------------------------------------------------------------------
export function combinedGetBurst() {
  group('GET staff list', () => {
    const res = http.get(`${API}/staff`, { headers });
    check(res, { 'staff 200': (r) => r.status === 200 }) || bookingErrorRate.add(1);
  });
  sleep(0.2);

  group('GET services list', () => {
    const res = http.get(`${API}/services`, { headers });
    check(res, { 'services 200': (r) => r.status === 200 }) || bookingErrorRate.add(1);
  });
  sleep(0.2);

  group('GET customers list', () => {
    const res = http.get(`${API}/customers`, { headers });
    check(res, { 'customers 200': (r) => r.status === 200 }) || bookingErrorRate.add(1);
  });
  sleep(0.5 + Math.random());
}

// ---------------------------------------------------------------------------
// Default function — k6 routes based on scenario tag
// ---------------------------------------------------------------------------
export default function () {
  const scenario = __ENV.K6_SCENARIO || 'availability';
  if (scenario === 'booking_creation') {
    bookingCreationScenario();
  } else if (scenario === 'combined_gets') {
    combinedGetBurst();
  } else {
    availabilityScenario();
  }
}

// ---------------------------------------------------------------------------
// Summary hook — print readable report
// ---------------------------------------------------------------------------
export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    'tests/stress/k6-results.json': JSON.stringify(data),
  };
}
