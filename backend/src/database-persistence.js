export function createDatabasePersistence(pool) {
  return {
    async saveQuote(quote, userId) {
      const result = await pool.query(
        `INSERT INTO quote_requests (
          product_id, product_name, quantity, company_name, contact_name, email,
          destination_country, notes, status, user_id
        ) SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, $10
          FROM products WHERE external_id = $1
          RETURNING id, created_at`,
        [
          quote.productId,
          quote.productName,
          quote.quantity,
          quote.companyName,
          quote.contactName,
          quote.email,
          quote.destinationCountry,
          quote.notes,
          quote.status,
          userId
        ]
      );

      if (!result.rows[0]) throw new Error('Unable to save quote request.');
      return {
        ...quote,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at.toISOString()
      };
    },

    async saveOrder(order, userId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO orders (
            id, user_id, status, payment_status, currency, product_price_cents,
            shipping_price_cents, tax_cents, total_cost_cents, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            order.id,
            userId,
            order.status,
            order.paymentStatus,
            order.currency,
            order.productPriceCents,
            order.shippingPriceCents,
            order.taxCents,
            order.totalCostCents,
            order.orderTime
          ]
        );

        for (const item of order.products) {
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, sku, quantity, unit_price_cents, estimated_delivery_at
            ) SELECT $1, id, $3, $4, $5, $6, $7 FROM products WHERE external_id = $2`,
            [
              order.id,
              item.productId,
              item.productName,
              item.sku,
              item.quantity,
              item.unitPriceCents,
              item.estimatedDeliveryTime
            ]
          );
        }

        await client.query('COMMIT');
        return order;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async listOrdersForUser(userId) {
      const result = await pool.query(
        `SELECT id, status, payment_status, currency, product_price_cents, shipping_price_cents,
                tax_cents, total_cost_cents, created_at
           FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        currency: row.currency,
        productPriceCents: row.product_price_cents,
        shippingPriceCents: row.shipping_price_cents,
        taxCents: row.tax_cents,
        totalCostCents: row.total_cost_cents,
        orderTime: row.created_at.toISOString()
      }));
    },

    async listQuotesForUser(userId) {
      const result = await pool.query(
        `SELECT id, product_name, quantity, destination_country, status, created_at
           FROM quote_requests WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows.map((row) => ({
        id: row.id,
        productName: row.product_name,
        quantity: row.quantity,
        destinationCountry: row.destination_country,
        status: row.status,
        createdAt: row.created_at.toISOString()
      }));
    }
  };
}
