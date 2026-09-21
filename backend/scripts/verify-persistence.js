import { createDatabaseCatalogue } from '../src/database-catalogue.js';
import { createDatabasePool } from '../src/database.js';
import { createDatabasePersistence } from '../src/database-persistence.js';
import { createOrderFromCart } from '../src/orders.js';
import { createQuoteRequest } from '../src/quotes.js';

const pool = createDatabasePool();
const catalogue = createDatabaseCatalogue(pool);
const persistence = createDatabasePersistence(pool);

try {
  const quote = await createQuoteRequest(
    {
      productId: 'rgw-excavator-001',
      quantity: 1,
      companyName: 'Rogontra Integration Test',
      contactName: 'Automated Test',
      email: 'integration-test@rogontra.invalid',
      destinationCountry: 'Nigeria',
      notes: 'Synthetic development-database verification record.'
    },
    catalogue.findProductById
  );
  const savedQuote = await persistence.saveQuote(quote);

  const order = await createOrderFromCart(
    [{ productId: 'rgw-cargo-straps-001', quantity: 1, deliveryOptionId: '1' }],
    catalogue.findProductById
  );
  const savedOrder = await persistence.saveOrder(order);
  const itemResult = await pool.query(
    'SELECT COUNT(*)::int AS count FROM order_items WHERE order_id = $1',
    [savedOrder.id]
  );

  console.info(
    JSON.stringify({
      orderId: savedOrder.id,
      orderStatus: savedOrder.status,
      orderItems: itemResult.rows[0].count,
      quoteId: savedQuote.id,
      quoteStatus: savedQuote.status
    })
  );
} finally {
  await pool.end();
}
