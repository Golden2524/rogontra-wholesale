import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createDatabasePool } from '../src/database.js';

const migrationPath = resolve('backend/database/migrations/001_initial_schema.sql');
const sql = await readFile(migrationPath, 'utf8');
const pool = createDatabasePool();

try {
  await pool.query(sql);
  console.info('Database migration completed successfully.');
} finally {
  await pool.end();
}
