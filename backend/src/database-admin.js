const PURCHASE_MODES = new Set(['checkout', 'quote']);
const CONDITIONS = new Set(['new', 'used', 'refurbished']);
const STOCK_STATUSES = new Set(['in_stock', 'limited_stock', 'out_of_stock', 'quote_required']);

function clientError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 400;
  return error;
}

function text(input, field, maximum = 200) {
  if (
    typeof input?.[field] !== 'string' ||
    !input[field].trim() ||
    input[field].trim().length > maximum
  ) {
    throw clientError(
      'INVALID_PRODUCT',
      `${field} is required and must be ${maximum} characters or fewer.`
    );
  }
  return input[field].trim();
}

function positiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw clientError('INVALID_PRODUCT', `${field} must be a positive whole number.`);
  }
  return value;
}

function validateProduct(input, { requireExternalId }) {
  const purchaseMode = text(input, 'purchaseMode', 20);
  if (!PURCHASE_MODES.has(purchaseMode)) {
    throw clientError('INVALID_PRODUCT', 'purchaseMode must be checkout or quote.');
  }
  const condition = text(input, 'condition', 20);
  if (!CONDITIONS.has(condition)) {
    throw clientError('INVALID_PRODUCT', 'condition must be new, used, or refurbished.');
  }
  const stockStatus = text(input, 'stockStatus', 30);
  if (!STOCK_STATUSES.has(stockStatus)) {
    throw clientError('INVALID_PRODUCT', 'stockStatus is not supported.');
  }
  const priceCents = input.priceCents;
  if (purchaseMode === 'checkout' && (!Number.isInteger(priceCents) || priceCents < 0)) {
    throw clientError(
      'INVALID_PRODUCT',
      'Checkout products need a non-negative USD price in cents.'
    );
  }
  if (purchaseMode === 'quote' && priceCents !== null) {
    throw clientError('INVALID_PRODUCT', 'Quote-only products must not have a checkout price.');
  }
  if (
    !Array.isArray(input.keywords) ||
    input.keywords.some((keyword) => typeof keyword !== 'string')
  ) {
    throw clientError('INVALID_PRODUCT', 'keywords must be an array of text values.');
  }
  if (
    !input.specifications ||
    typeof input.specifications !== 'object' ||
    Array.isArray(input.specifications)
  ) {
    throw clientError('INVALID_PRODUCT', 'specifications must be an object.');
  }

  const product = {
    sku: text(input, 'sku', 100),
    category: text(input, 'category', 100),
    name: text(input, 'name', 200),
    description:
      typeof input.description === 'string' ? input.description.trim().slice(0, 5000) : '',
    image: text(input, 'image', 2000),
    priceCents: purchaseMode === 'quote' ? null : priceCents,
    condition,
    minimumOrderQuantity: positiveInteger(input.minimumOrderQuantity, 'minimumOrderQuantity'),
    purchaseMode,
    stockStatus,
    keywords: input.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    specifications: input.specifications,
    isActive: input.isActive !== false
  };
  if (requireExternalId) {
    product.externalId = text(input, 'externalId', 100);
    if (!/^[a-z0-9][a-z0-9-]{2,99}$/.test(product.externalId)) {
      throw clientError(
        'INVALID_PRODUCT',
        'externalId must use lowercase letters, numbers, and hyphens.'
      );
    }
  }
  return product;
}

function mapAdminProduct(row) {
  return {
    externalId: row.external_id,
    sku: row.sku,
    category: row.category,
    name: row.name,
    description: row.description,
    image: row.image_url,
    priceCents: row.price_cents,
    condition: row.condition,
    minimumOrderQuantity: row.minimum_order_quantity,
    purchaseMode: row.purchase_mode,
    stockStatus: row.stock_status,
    keywords: row.specifications.keywords ?? [],
    specifications: row.specifications,
    isActive: row.is_active,
    isDemo: row.is_demo
  };
}

const adminProductSelect = `
  SELECT p.external_id, p.sku, p.name, p.description, p.price_cents, p.condition,
         p.minimum_order_quantity, p.purchase_mode, p.stock_status, p.specifications,
         p.is_active, p.is_demo, c.name AS category,
         COALESCE((SELECT pm.url FROM product_media pm WHERE pm.product_id = p.id ORDER BY pm.sort_order LIMIT 1), '') AS image_url
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

export function createDatabaseAdminCatalogue(pool) {
  async function upsertCategory(client, categoryName) {
    const result = await client.query(
      `INSERT INTO categories (name, slug) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        categoryName,
        categoryName
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, '-')
          .replaceAll(/^-|-$/g, '')
      ]
    );
    return result.rows[0].id;
  }

  async function saveProduct(input, existingExternalId) {
    const product = validateProduct(input, { requireExternalId: !existingExternalId });
    const externalId = existingExternalId ?? product.externalId;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const categoryId = await upsertCategory(client, product.category);
      const result = await client.query(
        `INSERT INTO products (
           external_id, sku, category_id, name, description, price_cents, currency, condition,
           minimum_order_quantity, purchase_mode, stock_status, specifications, is_active, is_demo
         ) VALUES ($1, $2, $3, $4, $5, $6, 'USD', $7, $8, $9, $10, $11, $12, FALSE)
         ON CONFLICT (external_id) DO UPDATE SET
           sku = EXCLUDED.sku, category_id = EXCLUDED.category_id, name = EXCLUDED.name,
           description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
           condition = EXCLUDED.condition, minimum_order_quantity = EXCLUDED.minimum_order_quantity,
           purchase_mode = EXCLUDED.purchase_mode, stock_status = EXCLUDED.stock_status,
           specifications = EXCLUDED.specifications, is_active = EXCLUDED.is_active,
           is_demo = FALSE, updated_at = NOW()
         RETURNING id`,
        [
          externalId,
          product.sku,
          categoryId,
          product.name,
          product.description,
          product.priceCents,
          product.condition,
          product.minimumOrderQuantity,
          product.purchaseMode,
          product.stockStatus,
          { ...product.specifications, keywords: product.keywords },
          product.isActive
        ]
      );
      const productId = result.rows[0].id;
      await client.query('DELETE FROM product_media WHERE product_id = $1', [productId]);
      await client.query(
        'INSERT INTO product_media (product_id, url, alt_text) VALUES ($1, $2, $3)',
        [productId, product.image, product.name]
      );
      await client.query('COMMIT');
      return this.findByExternalId(externalId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    async listProducts() {
      const result = await pool.query(`${adminProductSelect} ORDER BY p.created_at DESC`);
      return result.rows.map(mapAdminProduct);
    },

    async findByExternalId(externalId) {
      const result = await pool.query(`${adminProductSelect} WHERE p.external_id = $1`, [
        externalId
      ]);
      return result.rows[0] ? mapAdminProduct(result.rows[0]) : undefined;
    },

    async createProduct(input) {
      return saveProduct.call(this, input);
    },

    async updateProduct(externalId, input) {
      const existing = await this.findByExternalId(externalId);
      if (!existing) return undefined;
      return saveProduct.call(this, input, externalId);
    }
  };
}
