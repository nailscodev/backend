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
    case 'stress': return 40;  // ramp from 1 to 50
    case 'spike':  return 40;  // 10s base + 15s spike + 15s recovery
    case 'soak':   return 120; // 2-minute steady soak
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
      // Linear ramp 1 → 50 over 40 seconds
      return Math.min(50, Math.max(1, Math.ceil(elapsed * 1.2)));
    }
    case 'spike': {
      if (elapsed < 10) return 2;
      if (elapsed < 25) return 50;
      return 2;
    }
    case 'soak': {
      if (elapsed < 5) return Math.ceil(elapsed * 2);        // quick 0→10 ramp
      return 10;
    }
  }
}

function scenarioDescription(type: TestType): string {
  switch (type) {
    case 'load':
      return 'Load Test: Ramp from 0 → 10 VUs over 10s, hold 30s steady, ramp down 10s. Validates expected traffic.';
    case 'stress':
      return 'Stress Test: Ramp from 1 → 50 VUs over 40s. Finds the breaking point.';
    case 'spike':
      return 'Spike Test: 2 VUs base → sudden jump to 50 VUs for 15s → recover. Simulates a traffic burst.';
    case 'soak':
      return 'Soak Test: 10 VUs for 2 minutes. Detects memory leaks and performance degradation over time.';
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
    const baseUrl = dto.baseUrl || process.env.BASE_URL || 'http://localhost:3001';

    const endpoints = [
      `${baseUrl}/api/health`,
      `${baseUrl}/api/services/list`,
      `${baseUrl}/api/staff/available`,
      `${baseUrl}/api/addons?page=1&limit=20`,
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
            if (res.statusCode && res.statusCode >= 500) {
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
