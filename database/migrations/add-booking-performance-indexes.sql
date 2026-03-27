-- Migration: add performance indexes for bookings table
-- These indexes accelerate the two most frequent query patterns:
--   1. Staff availability checks filtered by staff + date
--   2. Date-range report queries sorted by creation time
--
-- Usage: psql $DATABASE_URL -f backend/database/migrations/add-booking-performance-indexes.sql
-- CONCURRENTLY prevents table lock — safe to run against live production database.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_staff_date
  ON bookings ("staffId", "appointmentDate");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at_desc
  ON bookings ("createdAt" DESC);
