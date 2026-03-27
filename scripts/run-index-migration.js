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
];

const VERIFY_SQL = `
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'bookings'
    AND indexname IN ('idx_bookings_staff_date', 'idx_bookings_created_at_desc')
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

  for (const index of SQL_INDEXES) {
    console.log(`Creating ${index.name}...`);
    await client.query(index.sql);
    console.log(`  OK: ${index.name}`);
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
