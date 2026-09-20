import { createDatabasePool } from '../src/database.js';

const pool = createDatabasePool();

try {
  const migrations = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('users', 'products', 'orders', 'payment_attempts', 'quote_requests')
    ORDER BY table_name
  `);

  console.info(
    JSON.stringify({
      migrations: migrations.rows.map((row) => row.version),
      coreTables: tables.rows.map((row) => row.table_name)
    })
  );
} finally {
  await pool.end();
}
