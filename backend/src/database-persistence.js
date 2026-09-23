export function createDatabasePersistence(pool) {
  const quoteStatuses = new Set(['received', 'reviewing', 'quoted', 'closed', 'cancelled']);
  const orderStatuses = new Set([
    'awaiting_payment',
    'preparing',
    'dispatched',
    'delivered',
    'cancelled'
  ]);

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
                tax_cents, total_cost_cents, created_at,
                COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'productId', p.external_id,
                        'productName', oi.product_name,
                        'quantity', oi.quantity,
                        'estimatedDeliveryTime', oi.estimated_delivery_at
                      ) ORDER BY oi.id
                    )
                    FROM order_items oi
                    JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = orders.id
                  ),
                  '[]'
                ) AS products
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
        orderTime: row.created_at.toISOString(),
        products: row.products
      }));
    },

    async getOrderForUser(userId, orderId) {
      const result = await pool.query(
        `SELECT o.id, o.status, o.payment_status, o.currency, o.product_price_cents,
                o.shipping_price_cents, o.tax_cents, o.total_cost_cents, o.created_at,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'productId', p.external_id,
                      'productName', oi.product_name,
                      'quantity', oi.quantity,
                      'estimatedDeliveryTime', oi.estimated_delivery_at
                    ) ORDER BY oi.id
                  ) FILTER (WHERE oi.id IS NOT NULL),
                  '[]'
                ) AS products
           FROM orders o
           LEFT JOIN order_items oi ON oi.order_id = o.id
           LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.user_id = $1 AND o.id = $2
          GROUP BY o.id`,
        [userId, orderId]
      );
      const row = result.rows[0];
      if (!row) return undefined;

      return {
        id: row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        currency: row.currency,
        productPriceCents: row.product_price_cents,
        shippingPriceCents: row.shipping_price_cents,
        taxCents: row.tax_cents,
        totalCostCents: row.total_cost_cents,
        orderTime: row.created_at.toISOString(),
        products: row.products
      };
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
    },

    async listQuotesForAdmin() {
      const result = await pool.query(
        `SELECT id, product_name, quantity, company_name, contact_name, email,
                destination_country, notes, status, created_at
           FROM quote_requests ORDER BY created_at DESC`
      );
      return result.rows.map((row) => ({
        id: row.id,
        productName: row.product_name,
        quantity: row.quantity,
        companyName: row.company_name,
        contactName: row.contact_name,
        email: row.email,
        destinationCountry: row.destination_country,
        notes: row.notes,
        status: row.status,
        createdAt: row.created_at.toISOString()
      }));
    },

    async updateQuoteStatus(quoteId, status) {
      if (!quoteStatuses.has(status)) {
        const error = new Error('Quote status is not supported.');
        error.code = 'INVALID_QUOTE_STATUS';
        error.statusCode = 400;
        throw error;
      }
      const result = await pool.query(
        `UPDATE quote_requests SET status = $2 WHERE id = $1
         RETURNING id, product_name, quantity, company_name, contact_name, email,
                   destination_country, notes, status, created_at`,
        [quoteId, status]
      );
      const row = result.rows[0];
      return row
        ? {
            id: row.id,
            productName: row.product_name,
            quantity: row.quantity,
            companyName: row.company_name,
            contactName: row.contact_name,
            email: row.email,
            destinationCountry: row.destination_country,
            notes: row.notes,
            status: row.status,
            createdAt: row.created_at.toISOString()
          }
        : undefined;
    },

    async listOrdersForAdmin() {
      const result = await pool.query(
        `SELECT o.id, o.status, o.payment_status, o.currency, o.total_cost_cents, o.created_at,
                u.email AS customer_email, u.display_name AS customer_name,
                COALESCE(
                  (
                    SELECT json_agg(json_build_object('productName', oi.product_name, 'quantity', oi.quantity) ORDER BY oi.id)
                      FROM order_items oi WHERE oi.order_id = o.id
                  ),
                  '[]'
                ) AS items
           FROM orders o
           LEFT JOIN users u ON u.id = o.user_id
          ORDER BY o.created_at DESC`
      );
      return result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        currency: row.currency,
        totalCostCents: row.total_cost_cents,
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        items: row.items,
        createdAt: row.created_at.toISOString()
      }));
    },

    async updateOrderStatus(orderId, status) {
      if (!orderStatuses.has(status)) {
        const error = new Error('Order status is not supported.');
        error.code = 'INVALID_ORDER_STATUS';
        error.statusCode = 400;
        throw error;
      }
      const current = await pool.query('SELECT payment_status FROM orders WHERE id = $1', [
        orderId
      ]);
      if (!current.rows[0]) return undefined;
      if (status !== 'cancelled' && current.rows[0].payment_status !== 'paid') {
        const error = new Error('Only verified paid orders can enter fulfilment.');
        error.code = 'ORDER_NOT_PAID';
        error.statusCode = 409;
        throw error;
      }
      const result = await pool.query(
        `UPDATE orders SET status = $2 WHERE id = $1
         RETURNING id, status, payment_status, currency, total_cost_cents, created_at`,
        [orderId, status]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        currency: row.currency,
        totalCostCents: row.total_cost_cents,
        createdAt: row.created_at.toISOString()
      };
    },

    async createPaymentAttempt({ amountCents, currency, orderId, provider, reference }) {
      await pool.query(
        `INSERT INTO payment_attempts (
          order_id, provider, provider_reference, requested_currency, requested_amount_minor, status
        ) VALUES ($1, $2, $3, $4, $5, 'initialized')`,
        [orderId, provider, reference, currency, amountCents]
      );
    },

    async getPaymentAttemptForUser(userId, reference) {
      const result = await pool.query(
        `SELECT pa.order_id, pa.provider, pa.provider_reference, pa.requested_currency,
                pa.requested_amount_minor, pa.status
           FROM payment_attempts pa
           JOIN orders o ON o.id = pa.order_id
          WHERE o.user_id = $1 AND pa.provider_reference = $2`,
        [userId, reference]
      );
      const row = result.rows[0];
      return row
        ? {
            orderId: row.order_id,
            provider: row.provider,
            reference: row.provider_reference,
            requestedCurrency: row.requested_currency,
            requestedAmountCents: row.requested_amount_minor,
            status: row.status
          }
        : undefined;
    },

    async recordPaymentVerification({ attempt, verifiedPayment }) {
      const isPaid =
        verifiedPayment.status === 'success' &&
        verifiedPayment.providerReference === attempt.reference &&
        verifiedPayment.currency === attempt.requestedCurrency &&
        verifiedPayment.amountCents === attempt.requestedAmountCents;
      const attemptStatus = isPaid
        ? 'success'
        : verifiedPayment.status === 'failed'
          ? 'failed'
          : 'pending';
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE payment_attempts SET status = $2, verified_at = NOW()
            WHERE provider_reference = $1`,
          [attempt.reference, attemptStatus]
        );
        if (isPaid) {
          await client.query("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [
            attempt.orderId
          ]);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      return { paid: isPaid, status: attemptStatus };
    }
  };
}
