import { createDatabasePool } from '../src/database.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email) {
  throw new Error('Set ADMIN_EMAIL in your private .env.local file before running this command.');
}

const pool = createDatabasePool();
try {
  const result = await pool.query(
    `UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = $1
     RETURNING email, display_name`,
    [email]
  );
  if (!result.rows[0]) {
    throw new Error('No customer account exists for ADMIN_EMAIL. Register that account first.');
  }
  console.info(`Granted administrator access to ${result.rows[0].email}.`);
} finally {
  await pool.end();
}
