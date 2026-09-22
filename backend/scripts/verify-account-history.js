import { randomUUID } from 'node:crypto';

import { createAuthService } from '../src/auth.js';
import { createDatabaseCatalogue } from '../src/database-catalogue.js';
import { createDatabasePersistence } from '../src/database-persistence.js';
import { createDatabasePool } from '../src/database.js';
import { createDatabaseUserRepository } from '../src/database-users.js';
import { createOrderFromCart } from '../src/orders.js';
import { createQuoteRequest } from '../src/quotes.js';

const pool = createDatabasePool();
const catalogue = createDatabaseCatalogue(pool);
const persistence = createDatabasePersistence(pool);
const auth = createAuthService({
  repository: createDatabaseUserRepository(pool),
  secret: process.env.JWT_SECRET
});

try {
  const password = `development-${randomUUID()}-password`;
  const registration = await auth.register({
    displayName: 'Rogontra History Test',
    email: `history-${randomUUID()}@rogontra.invalid`,
    password
  });
  const userId = auth.verifyToken(registration.token).id;
  const order = await createOrderFromCart(
    [{ productId: 'rgw-cargo-straps-001', quantity: 1, deliveryOptionId: '1' }],
    catalogue.findProductById
  );
  await persistence.saveOrder(order, userId);
  const quote = await createQuoteRequest(
    {
      productId: 'rgw-excavator-001',
      quantity: 1,
      companyName: 'Rogontra History Test',
      contactName: 'Automated Test',
      email: registration.user.email,
      destinationCountry: 'Nigeria',
      notes: 'Synthetic account-history verification record.'
    },
    catalogue.findProductById
  );
  await persistence.saveQuote(quote, userId);
  const [orders, quotes] = await Promise.all([
    persistence.listOrdersForUser(userId),
    persistence.listQuotesForUser(userId)
  ]);

  console.info(JSON.stringify({ userId, ownOrders: orders.length, ownQuotes: quotes.length }));
} finally {
  await pool.end();
}
