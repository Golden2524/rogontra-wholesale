import { createDatabasePool } from '../src/database.js';

const pool = createDatabasePool();

try {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS products,
      COUNT(*) FILTER (WHERE is_demo = TRUE)::int AS demo_products,
      COUNT(*) FILTER (WHERE purchase_mode = 'quote')::int AS quote_products,
      COUNT(DISTINCT category_id)::int AS categories
    FROM products
  `);

  console.info(JSON.stringify(result.rows[0]));
} finally {
  await pool.end();
}
