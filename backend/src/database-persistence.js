export function createDatabasePersistence(pool) {
  return {
    async saveQuote(quote) {
      const result = await pool.query(
        `INSERT INTO quote_requests (
          product_id, product_name, quantity, company_name, contact_name, email,
          destination_country, notes, status
        ) SELECT id, $2, $3, $4, $5, $6, $7, $8, $9
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
          quote.status
        ]
      );

      if (!result.rows[0]) throw new Error('Unable to save quote request.');
      return {
        ...quote,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at.toISOString()
      };
    },

    async saveOrder(order) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO orders (
            id, status, payment_status, currency, product_price_cents,
            shipping_price_cents, tax_cents, total_cost_cents, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            order.id,
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
    }
  };
}
