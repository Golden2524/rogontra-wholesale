import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createDatabasePool } from '../src/database.js';

const catalogue = JSON.parse(await readFile(resolve('backend/rogontra-catalogue.json'), 'utf8'));
const pool = createDatabasePool();

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const product of catalogue) {
      const category = await client.query(
        `INSERT INTO categories (name, slug)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          product.category,
          product.category
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, '-')
            .replaceAll(/^-|-$/g, '')
        ]
      );

      const savedProduct = await client.query(
        `INSERT INTO products (
          external_id, sku, category_id, name, price_cents, currency, condition,
          minimum_order_quantity, purchase_mode, stock_status, specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (external_id) DO UPDATE SET
          sku = EXCLUDED.sku,
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          price_cents = EXCLUDED.price_cents,
          condition = EXCLUDED.condition,
          minimum_order_quantity = EXCLUDED.minimum_order_quantity,
          purchase_mode = EXCLUDED.purchase_mode,
          stock_status = EXCLUDED.stock_status,
          specifications = EXCLUDED.specifications,
          updated_at = NOW()
        RETURNING id`,
        [
          product.id,
          product.sku,
          category.rows[0].id,
          product.name,
          product.priceCents,
          product.currency,
          product.condition,
          product.minimumOrderQuantity,
          product.purchaseMode,
          product.stockStatus,
          { ...product.specifications, keywords: product.keywords }
        ]
      );

      const productId = savedProduct.rows[0]?.id;
      await client.query('DELETE FROM product_media WHERE product_id = $1', [productId]);
      await client.query(
        'INSERT INTO product_media (product_id, url, alt_text) VALUES ($1, $2, $3)',
        [productId, product.image, product.name]
      );
    }

    await client.query('COMMIT');
    console.info(`Seeded ${catalogue.length} illustrative Rogontra products.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
