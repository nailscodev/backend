import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';
import { PerformanceTestRunEntity } from './performance-test-run.entity';

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
      return 'Load Test: Ramp 0→10 VUs over 10s, hold 30s steady, ramp down 10s (50s total). Targets: turnero frontend availability.';
    case 'stress':
      return 'Stress Test: Staged ramp 1→5→10→20→30→50 VUs over 60s then cool-down. Finds the point where the turnero frontend degrades.';
    case 'spike':
      return 'Spike Test: 2 VUs base → instant jump to 20 VUs for 15s → recover to 2 VUs (40s total). Simulates viral traffic burst on the turnero.';
    case 'soak':
      return 'Soak Test: Ramp to 10 VUs, hold 160s steady, ramp down (180s total). Detects CDN/cache eviction and connection issues over time.';
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

  /** In-memory cache — keeps live timeSeries data for the current run */
  private readonly runs = new Map<string, TestResult>();

  constructor(
    @InjectModel(PerformanceTestRunEntity)
    private readonly runModel: typeof PerformanceTestRunEntity,
  ) {}

  async onModuleInit() {
    this.logger.log('PerformanceTestsService ready');

    // Auto-create table on boot (idempotent — uses IF NOT EXISTS).
    // Avoids needing psql in the container for manual migrations.
    try {
      await this.runModel.sequelize!.query(`
        CREATE TABLE IF NOT EXISTS performance_test_runs (
          id               UUID          PRIMARY KEY,
          type             VARCHAR(20)   NOT NULL,
          status           VARCHAR(20)   NOT NULL DEFAULT 'running',
          started_at       TIMESTAMPTZ   NOT NULL,
          completed_at     TIMESTAMPTZ,
          progress         SMALLINT      NOT NULL DEFAULT 0,
          scenario         TEXT,
          target_endpoints JSONB,
          summary          JSONB,
          "createdAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
          "updatedAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_perf_test_runs_status
          ON performance_test_runs (status);
        CREATE INDEX IF NOT EXISTS idx_perf_test_runs_started_at
          ON performance_test_runs (started_at DESC);
      `, { type: QueryTypes.RAW });
      this.logger.log('performance_test_runs table ready');
    } catch (err) {
      this.logger.error('Failed to create performance_test_runs table', err);
    }

    // On restart, mark any runs left in 'running' state as failed
    try {
      const updated = await this.runModel.update(
        { status: 'failed' },
        { where: { status: 'running' } },
      );
      if (updated[0] > 0) {
        this.logger.warn(`Marked ${updated[0]} stale running test(s) as failed on startup`);
      }
    } catch (err) {
      this.logger.error('Failed to cleanup stale runs on startup', err);
    }
  }

  /** Returns the 10 most recent test results from the database */
  async listResults(): Promise<TestResult[]> {
    try {
      const rows = await this.runModel.findAll({
        order: [['started_at', 'DESC']],
        limit: 10,
      });
      return rows.map((r) => this.rowToResult(r));
    } catch (err) {
      this.logger.error('Failed to list test results from DB', err);
      // Fallback to in-memory cache so the UI still gets data if DB is unavailable
      return Array.from(this.runs.values()).sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
    }
  }

  /**
   * Returns a single test result.
   * Tries the in-memory cache first (has live timeSeries), falls back to DB.
   */
  async getResult(id: string): Promise<TestResult | undefined> {
    const cached = this.runs.get(id);
    if (cached) return cached;

    try {
      const row = await this.runModel.findByPk(id);
      if (!row) return undefined;
      return this.rowToResult(row);
    } catch (err) {
      this.logger.error(`Failed to fetch test run ${id} from DB`, err);
      return undefined;
    }
  }

  /** Maps a DB row to the TestResult shape the controller/frontend expects */
  private rowToResult(row: PerformanceTestRunEntity): TestResult {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? undefined,
      progress: row.progress,
      currentVus: 0,
      timeSeries: [],
      summary: row.summary as TestSummary | undefined,
      targetEndpoints: row.targetEndpoints ?? [],
      scenario: row.scenario ?? '',
    };
  }

  /**
   * Starts a performance test asynchronously and returns the initial TestResult.
   * The caller should poll `getResult(id)` for progress.
   */
  async startTest(dto: RunTestDto): Promise<TestResult> {
    // Primary target: the booking webapp (turnero — separate Fly.io machine).
    // IMPORTANT: backend API endpoints (nailsco-backend.fly.dev/api/v1/*) are intentionally
    // excluded from this embedded runner. Firing them from within the same process creates
    // a self-DDoS: the backend handles its own VU traffic on the same single-threaded Node.js
    // event loop, saturates the CPU, and Fly.io OOM-kills/restarts the process — wiping the
    // in-memory runs Map and causing immediate 404s on every subsequent poll.
    // To stress-test the backend API, run k6 externally: `k6 run backend/tests/stress/load-test.js`
    const frontendUrl =
      dto.baseUrl ||
      process.env.FRONTEND_URL ||
      'https://nailsco-frontend.fly.dev';

    // Two frontend pages — served by a different Fly.io machine, no feedback loop.
    const endpoints = [
      `${frontendUrl}/`,        // Turnero landing page
      `${frontendUrl}/booking`, // Booking flow (Next.js SSR)
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

    // Prune old runs (keep last 10) from in-memory cache
    if (this.runs.size > 10) {
      const oldestKey = this.runs.keys().next().value;
      if (oldestKey) this.runs.delete(oldestKey);
    }

    // Persist initial run state to DB so other machines can find it
    try {
      await this.runModel.create({
        id: run.id,
        type: run.type,
        status: run.status,
        startedAt: run.startedAt,
        progress: run.progress,
        scenario: run.scenario,
        targetEndpoints: run.targetEndpoints,
        summary: null,
      } as any);
    } catch (err) {
      this.logger.error(`Failed to persist run ${run.id} to DB`, err);
      // Continue — in-memory fallback still works for this machine
    }

    // Run test in the background (do not await)
    this.executeTest(run, endpoints).catch((err) => {
      this.logger.error(`Test ${run.id} failed: ${err.message}`);
      run.status = 'failed';
      // Persist failed status to DB
      this.runModel.update(
        { status: 'failed', progress: run.progress },
        { where: { id: run.id } },
      ).catch((dbErr) => this.logger.error(`Failed to mark run ${run.id} as failed in DB`, dbErr));
    });

    // Wall-clock backstop: force-complete if the setInterval stalls (event-loop saturation).
    // +10s grace period is enough to absorb Fly.io CPU-throttle jitter without leaving
    // the UI stuck at 96% for nearly a minute (the old +45s was too generous).
    const backstopMs = (scenarioDuration(dto.type) + 10) * 1000;
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
        // Persist backstop completion to DB
        this.runModel.update(
          { status: 'completed', completedAt: run.completedAt, progress: 100, summary: run.summary as any },
          { where: { id: run.id } },
        ).catch((dbErr) => this.logger.error(`Failed to persist backstop completion for ${run.id}`, dbErr));
      }
    }, backstopMs);

    return run;
  }

  /** Cancel a running test.
   * Returns:
   *   'cancelled'    — successfully cancelled
   *   'already_done' — run exists but is no longer running (completed/cancelled/failed)
   *   'not_found'    — no run with this ID in memory or DB
   */
  async cancelTest(id: string): Promise<'cancelled' | 'already_done' | 'not_found'> {
    const run = this.runs.get(id);
    if (run) {
      if (run.status !== 'running') return 'already_done';
      run.status = 'cancelled';
    }
    // Always try to update DB so the cancel is durable
    try {
      const [affected] = await this.runModel.update(
        { status: 'cancelled' },
        { where: { id, status: 'running' } },
      );
      if (affected === 0 && !run) {
        // Check if it exists at all
        const exists = await this.runModel.count({ where: { id } });
        return exists > 0 ? 'already_done' : 'not_found';
      }
    } catch (err) {
      this.logger.error(`Failed to cancel run ${id} in DB`, err);
    }
    return run ? 'cancelled' : 'already_done';
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

      // Belt-and-suspenders: if the interval fires late due to CPU throttling and
      // elapsed has already overshot totalSeconds, force-complete immediately instead
      // of waiting for the backstop setTimeout.
      if (elapsed > totalSeconds + 2 && run.status === 'running') {
        this.logger.warn(`Test ${run.id} interval overshot by ${elapsed - totalSeconds}s — completing inline`);
        clearInterval(interval);
        vuAbortControllers.forEach((c) => c.abort());
        vuAbortControllers.length = 0;
        run.status = 'completed';
        run.completedAt = new Date();
        run.progress = 100;
        run.currentVus = 0;
        // Persist inline overshot completion
        this.runModel.update(
          { status: 'completed', completedAt: run.completedAt, progress: 100 },
          { where: { id: run.id } },
        ).catch((dbErr) => this.logger.error(`Failed to persist overshot completion for ${run.id}`, dbErr));
        return;
      }

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

        // Persist final completed state to DB
        this.runModel.update(
          { status: 'completed', completedAt: run.completedAt, progress: 100, summary: run.summary as any },
          { where: { id: run.id } },
        ).catch((dbErr) => this.logger.error(`Failed to persist completion for ${run.id}`, dbErr));
      }
      })();
    }, intervalMs);
  }
}
