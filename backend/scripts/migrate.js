import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createDatabasePool } from '../src/database.js';

const migrationsDirectory = resolve('backend/database/migrations');
const pool = createDatabasePool();

try {
  const applied = await pool.query('SELECT version FROM schema_migrations');
  const appliedVersions = new Set(applied.rows.map((row) => row.version));
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (appliedVersions.has(version)) continue;

    const sql = await readFile(resolve(migrationsDirectory, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
        [version]
      );
      await client.query('COMMIT');
      console.info(`Applied migration ${version}.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  console.info('Database migrations are current.');
} finally {
  await pool.end();
}
