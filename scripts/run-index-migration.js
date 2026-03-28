const { Client } = require('pg');

const SQL_INDEXES = [
  {
    name: 'idx_bookings_staff_date',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_staff_date ON bookings ("staffId", "appointmentDate")',
  },
  {
    name: 'idx_bookings_created_at_desc',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at_desc ON bookings ("createdAt" DESC)',
  },
  // Query optimisation indexes (DBA audit 2026-03-27)
  {
    name: 'idx_bookings_status_date',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_date ON bookings (status, "appointmentDate") WHERE "deletedAt" IS NULL`,
  },
  {
    name: 'idx_bookings_upcoming',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_upcoming ON bookings (status, "appointmentDate", "startTime") WHERE status IN ('pending', 'in_progress') AND "deletedAt" IS NULL`,
  },
  {
    name: 'idx_bookings_not_deleted',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_not_deleted ON bookings ("appointmentDate", status) WHERE "deletedAt" IS NULL`,
  },
  {
    name: 'idx_staff_availability',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_availability ON staff (status, "isBookable", "isWebVisible") WHERE "deletedAt" IS NULL`,
  },
  {
    name: 'idx_services_catalog',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_catalog ON services ("isActive", "displayOrder", category_id) WHERE "deletedAt" IS NULL`,
  },
  {
    name: 'idx_customers_active',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active ON customers (email, "createdAt" DESC) WHERE "deletedAt" IS NULL`,
  },
  {
    name: 'idx_manual_adjustments_date_type',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manual_adjustments_date_type ON manual_adjustments ("createdAt" DESC, type, "paymentMethod")`,
  },
  {
    name: 'idx_notifications_pending',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_pending ON notifications (status, "createdAt" DESC)`,
  },
];

const VERIFY_SQL = `
  SELECT indexname FROM pg_indexes
  WHERE tablename IN ('bookings', 'staff', 'services', 'customers', 'manual_adjustments', 'notifications')
    AND indexname IN (
      'idx_bookings_staff_date', 'idx_bookings_created_at_desc',
      'idx_bookings_status_date', 'idx_bookings_upcoming', 'idx_bookings_not_deleted',
      'idx_staff_availability', 'idx_services_catalog', 'idx_customers_active',
      'idx_manual_adjustments_date_type', 'idx_notifications_pending'
    )
  ORDER BY tablename, indexname
`;

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database');

  let failures = 0;
  for (const index of SQL_INDEXES) {
    console.log(`Creating ${index.name}...`);
    try {
      await client.query(index.sql);
      console.log(`  OK: ${index.name}`);
    } catch (err) {
      // 42P07 = duplicate_table/index already exists — safe to skip
      if (err.code === '42P07') {
        console.log(`  SKIP (already exists): ${index.name}`);
      } else {
        console.error(`  ERR [${index.name}]: ${err.message}`);
        failures++;
      }
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} index(es) failed.`);
  }

  const result = await client.query(VERIFY_SQL);
  console.log('\nVerification — indexes found:');
  result.rows.forEach(row => console.log(' ', row.indexname));

  await client.end();
  console.log('\nMigration complete.');
}

run().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
