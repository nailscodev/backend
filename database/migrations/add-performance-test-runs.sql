-- Migration: add performance_test_runs table
-- Run against production DB before deploying the performance-tests DB persistence change.
-- Usage: psql $DATABASE_URL -f backend/database/migrations/add-performance-test-runs.sql

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

CREATE INDEX IF NOT EXISTS idx_perf_test_runs_status     ON performance_test_runs (status);
CREATE INDEX IF NOT EXISTS idx_perf_test_runs_started_at ON performance_test_runs (started_at DESC);
