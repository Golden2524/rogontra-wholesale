function mapProduct(row) {
  return {
    id: row.external_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    image: row.image_url,
    priceCents: row.price_cents,
    currency: row.currency,
    category: row.category,
    condition: row.condition,
    minimumOrderQuantity: row.minimum_order_quantity,
    purchaseMode: row.purchase_mode,
    stockStatus: row.stock_status,
    keywords: row.specifications.keywords ?? [],
    specifications: row.specifications
  };
}

const productSelect = `
  SELECT p.external_id, p.sku, p.name, p.description, p.price_cents, p.currency, p.condition,
         p.minimum_order_quantity, p.purchase_mode, p.stock_status, p.specifications,
         c.name AS category,
         COALESCE((SELECT pm.url FROM product_media pm WHERE pm.product_id = p.id ORDER BY pm.sort_order LIMIT 1), '') AS image_url
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.is_active = TRUE
`;

export function createDatabaseCatalogue(pool) {
  return {
    async findProductById(productId) {
      const result = await pool.query(`${productSelect} AND p.external_id = $1`, [productId]);
      return result.rows[0] ? mapProduct(result.rows[0]) : undefined;
    },

    async listProducts({ category, query } = {}) {
      const values = [];
      const clauses = [];
      if (query) {
        values.push(`%${query}%`);
        clauses.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
      }
      if (category) {
        values.push(category);
        clauses.push(`c.name = $${values.length}`);
      }
      const where = clauses.length ? ` AND ${clauses.join(' AND ')}` : '';
      const result = await pool.query(`${productSelect}${where} ORDER BY p.name`, values);
      return result.rows.map(mapProduct);
    },

    async listCategories() {
      const result = await pool.query('SELECT name FROM categories ORDER BY name');
      return result.rows.map((row) => row.name);
    }
  };
}
