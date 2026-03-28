-- Migration: Query Optimization Indexes
-- All indexes use CONCURRENTLY + IF NOT EXISTS for zero-downtime production deployment
-- Apply with: psql $DATABASE_URL -f database/migrations/add-query-optimization-indexes.sql
--
-- Context: these indexes target the 7+ repeated query patterns identified in
-- reservations.controller.ts (status+appointmentDate dashboard reports) as well as
-- availability checks, catalog browsing, and financial reporting.

-- 1. Bookings: partial composite for dashboard completed-booking reports (7x hotspot)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_date
  ON bookings (status, "appointmentDate")
  WHERE "deletedAt" IS NULL;

-- 2. Bookings: partial composite for upcoming appointments widget
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_upcoming
  ON bookings (status, "appointmentDate", "startTime")
  WHERE status IN ('pending', 'in_progress') AND "deletedAt" IS NULL;

-- 3. Bookings: partial composite for all date-range ORM queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_not_deleted
  ON bookings ("appointmentDate", status)
  WHERE "deletedAt" IS NULL;

-- 4. Staff: composite for availability lookups (runs on every booking check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_availability
  ON staff (status, "isBookable", "isWebVisible")
  WHERE "deletedAt" IS NULL;

-- 5. Services: composite for catalog browsing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_catalog
  ON services ("isActive", "displayOrder", category_id)
  WHERE "deletedAt" IS NULL;

-- 6. Customers: partial covering index for email lookups in booking flow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active
  ON customers (email, "createdAt" DESC)
  WHERE "deletedAt" IS NULL;

-- 7. Manual adjustments: composite for financial report GROUP BY date + paymentMethod
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_adjustments_date_type
  ON manual_adjustments ("createdAt" DESC, type, "paymentMethod");

-- 8. Notifications: composite for status-based retry and cleanup queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_pending
  ON notifications (status, "createdAt" DESC);
