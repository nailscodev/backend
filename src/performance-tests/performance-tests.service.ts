import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestType = 'load' | 'stress' | 'spike' | 'soak';
export type TestStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface TimeSeriesPoint {
  /** Elapsed seconds since test start */
  time: number;
  /** Requests per second in this interval */
  rps: number;
  /** Median response time (ms) */
  p50: number;
  /** 95th-percentile response time (ms) */
  p95: number;
  /** 99th-percentile response time (ms) */
  p99: number;
  /** % of requests that failed */
  errorRate: number;
  /** Active virtual users at this moment */
  vus: number;
  /** Cumulative successful requests */
  totalRequests: number;
  /** Cumulative failed requests */
  totalErrors: number;
}

export interface TestSummary {
  totalRequests: number;
  totalErrors: number;
  avgRps: number;
  p50: number;
  p95: number;
  p99: number;
  avgErrorRate: number;
  maxVus: number;
  /** Total test duration in seconds */
  duration: number;
}

export interface TestResult {
  id: string;
  type: TestType;
  status: TestStatus;
  startedAt: Date;
  completedAt?: Date;
  /** 0–100 */
  progress: number;
  /** How many VUs are currently active */
  currentVus: number;
  timeSeries: TimeSeriesPoint[];
  summary?: TestSummary;
  /** Which endpoints were targeted */
  targetEndpoints: string[];
  /** Human-readable description of the test scenario */
  scenario: string;
}

export interface RunTestDto {
  type: TestType;
  /** Base URL of the backend to test (default: uses process.env.BASE_URL) */
  baseUrl?: string;
}

// ─── VU Profile helpers ───────────────────────────────────────────────────────

/** Returns total test duration in seconds for a given type */
function scenarioDuration(type: TestType): number {
  switch (type) {
    case 'load':   return 50;  // 10s ramp + 30s steady + 10s ramp-down
    case 'stress': return 60;  // 5s+10s+10s+10s+10s+10s+5s stages → 60s
    case 'spike':  return 40;  // 10s base + 15s spike + 15s recovery
    case 'soak':   return 180; // 3-minute steady soak (quick CI-friendly version)
  }
}

/** Returns the number of VUs that should be active at `elapsedSeconds` */
function vuProfile(type: TestType, elapsed: number): number {
  switch (type) {
    case 'load': {
      if (elapsed < 10) return Math.ceil(elapsed);           // ramp 0→10 VUs
      if (elapsed < 40) return 10;                           // hold
      return Math.max(0, 10 - Math.ceil(elapsed - 40));      // ramp down
    }
    case 'stress': {
      // Mirrors k6 stages: 1→1(5s) →5(15s) →10(25s) →20(35s) →30(45s) →50(55s) →0(60s)
      if (elapsed < 5)  return 1;
      if (elapsed < 15) return Math.ceil(1 + ((elapsed - 5)  / 10) * 4);   // 1→5
      if (elapsed < 25) return Math.ceil(5 + ((elapsed - 15) / 10) * 5);   // 5→10
      if (elapsed < 35) return Math.ceil(10 + ((elapsed - 25) / 10) * 10); // 10→20
      if (elapsed < 45) return Math.ceil(20 + ((elapsed - 35) / 10) * 10); // 20→30
      if (elapsed < 55) return Math.ceil(30 + ((elapsed - 45) / 10) * 20); // 30→50
      return Math.max(0, 50 - Math.ceil((elapsed - 55) * 10));              // cool-down
    }
    case 'spike': {
      if (elapsed < 10) return 2;   // normal traffic
      if (elapsed < 25) return 20;  // spike (capped at 20 to avoid saturating the backend runner itself)
      return 2;                     // recovery
    }
    case 'soak': {
      if (elapsed < 10) return Math.ceil(elapsed);           // ramp 0→10 VUs in 10s
      if (elapsed < 170) return 10;                          // steady soak
      return Math.max(0, 10 - Math.ceil(elapsed - 170));     // cool-down
    }
  }
}

function scenarioDescription(type: TestType): string {
  switch (type) {
    case 'load':
      return 'Load Test: Ramp 0→10 VUs over 10s, hold 30s steady, ramp down 10s (50s total). Targets: turnero + booking APIs.';
    case 'stress':
      return 'Stress Test: Staged ramp 1→5→10→20→30→50 VUs over 60s then cool-down. Finds the breaking point of the turnero.';
    case 'spike':
      return 'Spike Test: 2 VUs base → instant jump to 20 VUs for 15s → recover to 2 VUs (40s total). Simulates viral traffic.';
    case 'soak':
      return 'Soak Test: Ramp to 10 VUs, hold 160s steady, ramp down (180s total). Detects memory leaks and DB connection drift.';
  }
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PerformanceTestsService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceTestsService.name);

  /** In-memory store — keeps last 10 runs */
  private readonly runs = new Map<string, TestResult>();

  onModuleInit() {
    this.logger.log('PerformanceTestsService ready');
  }

  /** Returns all stored test results, newest first */
  listResults(): TestResult[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
  }

  /** Returns a single test result or undefined */
  getResult(id: string): TestResult | undefined {
    return this.runs.get(id);
  }

  /**
   * Starts a performance test asynchronously and returns the initial TestResult.
   * The caller should poll `getResult(id)` for progress.
   */
  async startTest(dto: RunTestDto): Promise<TestResult> {
    // Primary target: the booking webapp (turnero)
    const frontendUrl =
      dto.baseUrl ||
      process.env.FRONTEND_URL ||
      'https://nailsco-frontend.fly.dev';

    // Backend API base (what the turnero calls under the hood)
    const backendUrl =
      process.env.BACKEND_SELF_URL ||
      process.env.BASE_URL ||
      'https://nailsco-backend.fly.dev';

    // Realistic booking-flow endpoints: frontend pages + public backend APIs
    // Staff endpoint requires JWT auth → excluded to avoid false 401 errors in metrics
    const endpoints = [
      `${frontendUrl}/`,                                       // Turnero landing page
      `${frontendUrl}/booking`,                               // Booking flow (SSR)
      `${backendUrl}/api/v1/categories`,                      // Service categories (public)
      `${backendUrl}/api/v1/services`,                        // Services list (public)
      `${backendUrl}/api/v1/services/list`,                   // Simple services array (public)
      `${backendUrl}/api/v1/addons`,                          // Add-ons list (public)
    ];

    const run: TestResult = {
      id: crypto.randomUUID(),
      type: dto.type,
      status: 'running',
      startedAt: new Date(),
      progress: 0,
      currentVus: 0,
      timeSeries: [],
      targetEndpoints: endpoints,
      scenario: scenarioDescription(dto.type),
    };

    this.runs.set(run.id, run);

    // Prune old runs (keep last 10)
    if (this.runs.size > 10) {
      const oldestKey = this.runs.keys().next().value;
      if (oldestKey) this.runs.delete(oldestKey);
    }

    // Run test in the background (do not await)
    this.executeTest(run, endpoints).catch((err) => {
      this.logger.error(`Test ${run.id} failed: ${err.message}`);
      run.status = 'failed';
    });

    // Wall-clock backstop: force-complete if the setInterval stalls (event-loop saturation)
    const backstopMs = (scenarioDuration(dto.type) + 45) * 1000;
    setTimeout(() => {
      if (run.status === 'running') {
        this.logger.warn(`Test ${run.id} backstop triggered — forcing completion`);
        run.status = 'completed';
        run.progress = 100;
        run.currentVus = 0;
        run.completedAt = new Date();
        if (!run.summary && run.timeSeries.length > 0) {
          const allP95 = run.timeSeries.map((p) => p.p95);
          const allRps = run.timeSeries.map((p) => p.rps);
          run.summary = {
            totalRequests: run.timeSeries[run.timeSeries.length - 1]?.totalRequests ?? 0,
            totalErrors:   run.timeSeries[run.timeSeries.length - 1]?.totalErrors ?? 0,
            avgRps:    Math.round((allRps.reduce((s, v) => s + v, 0) / allRps.length) * 10) / 10 || 0,
            p50:       run.timeSeries[Math.floor(run.timeSeries.length / 2)]?.p50 ?? 0,
            p95:       Math.round(allP95.reduce((s, v) => s + v, 0) / allP95.length) || 0,
            p99:       Math.round(run.timeSeries.map((p) => p.p99).reduce((s, v) => s + v, 0) / run.timeSeries.length) || 0,
            avgErrorRate: Math.round((run.timeSeries.reduce((s, p) => s + p.errorRate, 0) / run.timeSeries.length) * 10) / 10 || 0,
            maxVus:    Math.max(...run.timeSeries.map((p) => p.vus), 0),
            duration:  scenarioDuration(dto.type),
          };
        }
      }
    }, backstopMs);

    return run;
  }

  /** Cancel a running test */
  cancelTest(id: string): boolean {
    const run = this.runs.get(id);
    if (!run || run.status !== 'running') return false;
    run.status = 'cancelled';
    return true;
  }

  // ─── Core runner ────────────────────────────────────────────────────────────

  private async executeTest(
    run: TestResult,
    endpoints: string[],
  ): Promise<void> {
    const totalSeconds = scenarioDuration(run.type);
    const intervalMs = 2000; // Collect a data point every 2 seconds
    const startTime = Date.now();

    let cumulativeRequests = 0;
    let cumulativeErrors = 0;

    // Active VU loops — each entry is a promise that keeps firing until cancelled
    const vuAbortControllers: { abort: () => void }[] = [];

    // Tracks latencies collected in the current interval window
    let windowLatencies: number[] = [];
    let windowErrors = 0;
    let windowRequests = 0;

    /** Fires a single HTTP request and records the latency */
    const fireRequest = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const t0 = Date.now();
        const lib = url.startsWith('https') ? https : http;
        try {
          const req = lib.get(url, { timeout: 10000 }, (res) => {
            res.resume(); // Drain response
            const latency = Date.now() - t0;
            windowLatencies.push(latency);
            windowRequests++;
            // Count any non-2xx/3xx as an error (includes 4xx, 5xx)
            if (res.statusCode && res.statusCode >= 400) {
              windowErrors++;
            }
            resolve();
          });
          req.on('error', () => {
            const latency = Date.now() - t0;
            windowLatencies.push(latency);
            windowRequests++;
            windowErrors++;
            resolve();
          });
          req.on('timeout', () => {
            req.destroy();
            windowLatencies.push(10000);
            windowRequests++;
            windowErrors++;
            resolve();
          });
        } catch {
          windowRequests++;
          windowErrors++;
          resolve();
        }
      });
    };

    /** Starts a virtual user loop that continuously fires requests */
    const startVU = (endpointIndex: number): { abort: () => void } => {
      let active = true;
      const loop = async () => {
        while (active && run.status === 'running') {
          const url = endpoints[endpointIndex % endpoints.length];
          await fireRequest(url);
          // Small delay between requests per VU (50–150ms think time)
          await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
        }
      };
      loop().catch(() => { /* VU loop ended */ });
      return { abort: () => { active = false; } };
    };

    let activeVuCount = 0;
    let endpointIndex = 0;

    // Every interval: adjust VU count, collect metrics, store data point
    const interval = setInterval(() => {
      void (async () => {
      if (run.status !== 'running') {
        clearInterval(interval);
        return;
      }

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const targetVus = vuProfile(run.type, elapsed);

      // Scale VUs up or down
      while (activeVuCount < targetVus) {
        vuAbortControllers.push(startVU(endpointIndex++));
        activeVuCount++;
      }
      while (activeVuCount > targetVus) {
        const ctrl = vuAbortControllers.pop();
        if (ctrl) ctrl.abort();
        activeVuCount--;
      }

      // Compute interval statistics
      const sorted = [...windowLatencies].sort((a, b) => a - b);
      const intervalRps = windowRequests / (intervalMs / 1000);
      const errorRatePct = windowRequests > 0 ? (windowErrors / windowRequests) * 100 : 0;

      cumulativeRequests += windowRequests;
      cumulativeErrors += windowErrors;

      const point: TimeSeriesPoint = {
        time: elapsed,
        rps: Math.round(intervalRps * 10) / 10,
        p50: Math.round(percentile(sorted, 50)),
        p95: Math.round(percentile(sorted, 95)),
        p99: Math.round(percentile(sorted, 99)),
        errorRate: Math.round(errorRatePct * 10) / 10,
        vus: activeVuCount,
        totalRequests: cumulativeRequests,
        totalErrors: cumulativeErrors,
      };

      run.timeSeries.push(point);
      run.currentVus = activeVuCount;
      run.progress = Math.min(100, Math.round((elapsed / totalSeconds) * 100));

      // Reset window
      windowLatencies = [];
      windowErrors = 0;
      windowRequests = 0;

      // Check if test is done
      if (elapsed >= totalSeconds) {
        clearInterval(interval);
        // Stop all VUs
        vuAbortControllers.forEach((c) => c.abort());
        vuAbortControllers.length = 0;

        // Build summary
        const allLatencies = run.timeSeries.map((p) => p.p50).sort((a, b) => a - b);
        const allP95 = run.timeSeries.map((p) => p.p95);
        const allP99 = run.timeSeries.map((p) => p.p99);
        const allRps = run.timeSeries.map((p) => p.rps);

        run.summary = {
          totalRequests: cumulativeRequests,
          totalErrors: cumulativeErrors,
          avgRps: Math.round((allRps.reduce((s, v) => s + v, 0) / allRps.length) * 10) / 10 || 0,
          p50: Math.round(allLatencies[Math.floor(allLatencies.length / 2)] || 0),
          p95: Math.round(allP95.reduce((s, v) => s + v, 0) / allP95.length) || 0,
          p99: Math.round(allP99.reduce((s, v) => s + v, 0) / allP99.length) || 0,
          avgErrorRate:
            Math.round(
              (run.timeSeries.reduce((s, p) => s + p.errorRate, 0) / run.timeSeries.length) * 10,
            ) / 10 || 0,
          maxVus: Math.max(...run.timeSeries.map((p) => p.vus), 0),
          duration: totalSeconds,
        };

        run.status = 'completed';
        run.completedAt = new Date();
        run.progress = 100;
        run.currentVus = 0;

        this.logger.log(
          `Test ${run.id} (${run.type}) completed: ${cumulativeRequests} requests, ` +
            `${cumulativeErrors} errors, avg p95=${run.summary.p95}ms`,
        );
      }
      })();
    }, intervalMs);
  }
}
