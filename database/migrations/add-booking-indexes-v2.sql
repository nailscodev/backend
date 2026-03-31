-- Migration: add-booking-indexes-v2
-- Purpose: Add composite and specialized indexes identified in DBA audit
-- Run on existing instances: psql -U postgres -d nailsandco -f add-booking-indexes-v2.sql
-- Safe to run multiple times (all use CREATE INDEX IF NOT EXISTS)

-- Enable trigram extension for ILIKE-based search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPOSITE INDEXES ON bookings
-- ─────────────────────────────────────────────────────────────────────────────

-- IDX-1: (status, appointmentDate) — covers every dashboard query and updateExpiredBookings
-- Removes seq-scan on the full table when filtering by status + date range
CREATE INDEX IF NOT EXISTS idx_bookings_status_date
    ON bookings(status, "appointmentDate");

-- IDX-2: (staffId, appointmentDate, status) — covers conflict-check in create() and
-- verifyMultiAvailability in create-multiple; allows Index-Only Scan for slot checks
CREATE INDEX IF NOT EXISTS idx_bookings_staff_date_status
    ON bookings("staffId", "appointmentDate", status);

-- IDX-3: (appointmentDate, startTime) — covers ORDER BY in GET /list and GET /upcoming
CREATE INDEX IF NOT EXISTS idx_bookings_date_time
    ON bookings("appointmentDate", "startTime");

-- IDX-4: (customerId, appointmentDate) — covers GET /list and GET / filtered by customer
CREATE INDEX IF NOT EXISTS idx_bookings_customer_date
    ON bookings("customerId", "appointmentDate");

-- ─────────────────────────────────────────────────────────────────────────────
-- STAFF INDEX
-- ─────────────────────────────────────────────────────────────────────────────

-- IDX-5: (status, isBookable) — every availability endpoint loads all active+bookable staff
CREATE INDEX IF NOT EXISTS idx_staff_status_bookable
    ON staff(status, "isBookable");

-- ─────────────────────────────────────────────────────────────────────────────
-- GIN TRIGRAM INDEXES — ILIKE search acceleration
-- ─────────────────────────────────────────────────────────────────────────────

-- IDX-6a: bookings.notes for '%search%' in GET /list and GET /
CREATE INDEX IF NOT EXISTS idx_bookings_notes_trgm
    ON bookings USING GIN(notes gin_trgm_ops);

-- IDX-6b: customers.email for '%search%' in GET /list
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm
    ON customers USING GIN(email gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMERS INDEX
-- ─────────────────────────────────────────────────────────────────────────────

-- IDX-7: customers.createdAt — covers "new customers" COUNT in getDashboardStats
CREATE INDEX IF NOT EXISTS idx_customers_created_at
    ON customers("createdAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('bookings', 'staff', 'customers')
  AND indexname IN (
    'idx_bookings_status_date',
    'idx_bookings_staff_date_status',
    'idx_bookings_date_time',
    'idx_bookings_customer_date',
    'idx_staff_status_bookable',
    'idx_bookings_notes_trgm',
    'idx_customers_email_trgm',
    'idx_customers_created_at'
  )
ORDER BY tablename, indexname;
