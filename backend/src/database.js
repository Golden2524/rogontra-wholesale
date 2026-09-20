import pg from 'pg';

const { Pool } = pg;

export function createDatabasePool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to connect to PostgreSQL.');
  }

  const hostname = new URL(connectionString).hostname;
  const usesRemoteDatabase = hostname !== 'localhost' && hostname !== '127.0.0.1';

  return new Pool({
    connectionString,
    ssl: usesRemoteDatabase ? { rejectUnauthorized: false } : undefined
  });
}
