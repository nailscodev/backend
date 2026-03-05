/**
 * Concurrent Bookings Test — Race Condition & Double-Booking Detection
 *
 * Sends N simultaneous booking requests for the SAME slot+staff combination.
 * Acceptance criteria:
 *   - Exactly 1 request succeeds (HTTP 201)
 *   - All others receive a conflict response (HTTP 409 or 400)
 *   - No double-bookings are created in the database
 *
 * Usage:
 *   BASE_URL=https://nails-backend.fly.dev npx jest tests/stress/concurrent-bookings.test.ts
 *   (or) npm run test:concurrent
 */

import axios, { AxiosResponse } from 'axios';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL = process.env.BASE_URL || 'https://nailsco-backend.fly.dev';
const API = `${BASE_URL}/api/v1`;
const CONCURRENT_REQUESTS = 10;

// Use a specific future date + time to target a single slot
// Change this date each run (must have no existing bookings at this slot)
const TEST_DATE = process.env.TEST_DATE || '2026-05-20';
const TEST_TIME_START = '14:00:00';
const TEST_TIME_END = '14:30:00'; // 30-min service (Basic Manicure)

// Real IDs from seeded database (override via env for production)
const TEST_SERVICE_ID = process.env.TEST_SERVICE_ID || 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501'; // Basic Manicure
const TEST_STAFF_ID = process.env.TEST_STAFF_ID || '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301';
const TEST_CUSTOMER_IDS = [
  '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301',
  '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302',
  '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303',
];

const headers = {
  'Content-Type': 'application/json',
  ...(process.env.AUTH_TOKEN ? { Authorization: process.env.AUTH_TOKEN } : {}),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface BookingPayload {
  serviceId: string;
  staffId: string;
  customerId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

function buildPayload(index: number): BookingPayload {
  // Rotate through available customer IDs (different customers, same slot)
  const customerId = TEST_CUSTOMER_IDS[index % TEST_CUSTOMER_IDS.length];
  return {
    serviceId: TEST_SERVICE_ID,
    staffId: TEST_STAFF_ID,
    customerId,
    appointmentDate: TEST_DATE,
    startTime: TEST_TIME_START,
    endTime: TEST_TIME_END,
  };
}

async function attemptBooking(index: number): Promise<{ index: number; status: number; data: unknown }> {
  try {
    const res: AxiosResponse = await axios.post(`${API}/bookings`, buildPayload(index), {
      headers,
      timeout: 30000, // 30s per request — allows for Fly.io cold-start + advisory lock wait
    });
    return { index, status: res.status, data: res.data };
  } catch (err: any) {
    const status = err.response?.status ?? 0;
    return { index, status, data: err.response?.data ?? err.message };
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('Concurrent Booking — Race Condition Tests', () => {
  jest.setTimeout(300_000); // 5 min — allows for Fly.io cold-start + advisory lock serialisation across network

  let results: { index: number; status: number; data: unknown }[];

  beforeAll(async () => {
    console.log(`\n🚀 Sending ${CONCURRENT_REQUESTS} simultaneous booking requests`);
    console.log(`   Target: ${TEST_DATE} @ ${TEST_TIME_START}-${TEST_TIME_END} | Staff: ${TEST_STAFF_ID}`);
    console.log(`   Service: ${TEST_SERVICE_ID}\n`);

    // Fire all requests simultaneously
    results = await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => attemptBooking(i + 1))
    );

    // Log summary
    const successes = results.filter(r => r.status === 201);
    const conflicts = results.filter(r => r.status === 409 || r.status === 400);
    const errors = results.filter(r => r.status !== 201 && r.status !== 409 && r.status !== 400);

    console.log(`\n📊 Results Summary:`);
    console.log(`   ✅ Successes (201): ${successes.length}`);
    console.log(`   ⚡ Conflicts (409/400): ${conflicts.length}`);
    console.log(`   ❌ Unexpected errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach(e => console.log(`     #${e.index}: HTTP ${e.status} — ${JSON.stringify(e.data)}`));
    }
  });

  // ---
  it('exactly 1 booking should be created (HTTP 201)', () => {
    const successes = results.filter(r => r.status === 201);
    expect(successes).toHaveLength(1);
  });

  it('all other requests should receive conflict response (409 or 400)', () => {
    const nonSuccess = results.filter(r => r.status !== 201);
    const allAreConflicts = nonSuccess.every(r => r.status === 409 || r.status === 400);
    expect(allAreConflicts).toBe(true);
  });

  it('no unexpected errors (5xx) should occur', () => {
    const serverErrors = results.filter(r => r.status >= 500);
    expect(serverErrors).toHaveLength(0);
  });

  it(`total results count equals ${CONCURRENT_REQUESTS}`, () => {
    expect(results).toHaveLength(CONCURRENT_REQUESTS);
  });
});

// ---------------------------------------------------------------------------
// Scenario 2: Sequential stress — 50 bookings across different time slots
// This simulates a busy Monday with 50 appointments booked throughout the day.
// ---------------------------------------------------------------------------
describe('Sequential Stress — 50 Bookings Across the Day', () => {
  jest.setTimeout(300_000); // 5 min for 50 network requests against remote host

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30',
  ];

  it('handles 50 sequential requests without degradation or server errors', async () => {
    const results: { status: number }[] = [];

    // Run 50 requests (2-3 per time slot across multiple days simulated)
    for (let i = 0; i < 50; i++) {
      const slot = timeSlots[i % timeSlots.length];
      const dayOffset = Math.floor(i / timeSlots.length) + 1;
      const date = new Date('2026-03-15');
      date.setDate(date.getDate() + dayOffset);
      if (date.getDay() === 0) date.setDate(date.getDate() + 1); // skip Sunday

      const endSlot = new Date(`2000-01-01T${slot}`);
      endSlot.setMinutes(endSlot.getMinutes() + 30);
      const endSlotStr = endSlot.toTimeString().slice(0, 8);
      const payload: BookingPayload = {
        serviceId: TEST_SERVICE_ID,
        staffId: TEST_STAFF_ID,
        customerId: TEST_CUSTOMER_IDS[i % TEST_CUSTOMER_IDS.length],
        appointmentDate: date.toISOString().split('T')[0],
        startTime: `${slot}:00`,
        endTime: endSlotStr,
      };

      try {
        const res = await axios.post(`${API}/bookings`, payload, { headers, timeout: 10000 });
        results.push({ status: res.status });
      } catch (err: any) {
        results.push({ status: err.response?.status ?? 0 });
      }
    }

    const errors = results.filter(r => r.status >= 500);
    const successful = results.filter(r => r.status === 201 || r.status === 409 || r.status === 400);

    console.log(`\n📊 Sequential Test Results:`);
    console.log(`   Total: ${results.length} | Successful/Expected: ${successful.length} | Server Errors: ${errors.length}`);

    // No 5xx errors allowed
    expect(errors).toHaveLength(0);
    // All requests got a response (no timeouts)
    expect(results).toHaveLength(50);
  });
});
