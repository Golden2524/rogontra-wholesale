import { createApp } from './app.js';
import { getPort } from './config.js';
import { createDatabasePool } from './database.js';
import { createDatabaseCatalogue } from './database-catalogue.js';
import { createDatabasePersistence } from './database-persistence.js';
import { createAuthService } from './auth.js';
import { createDatabaseUserRepository } from './database-users.js';
import { createPaystackPaymentService } from './payments.js';
import { createDatabaseAdminCatalogue } from './database-admin.js';

const pool = createDatabasePool();
const app = createApp({
  catalogue: createDatabaseCatalogue(pool),
  adminCatalogue: createDatabaseAdminCatalogue(pool),
  persistence: createDatabasePersistence(pool),
  paymentService: createPaystackPaymentService({
    callbackUrl: process.env.PAYMENT_CALLBACK_URL,
    secretKey: process.env.PAYSTACK_SECRET_KEY
  }),
  readiness: async () => {
    await pool.query('SELECT 1');
  },
  auth: createAuthService({
    repository: createDatabaseUserRepository(pool),
    secret: process.env.JWT_SECRET
  })
});
const port = getPort();

const server = app.listen(port, '0.0.0.0', () => {
  console.info(`Rogontra API is listening on port ${port}.`);
});

async function closeServer() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.once('SIGINT', closeServer);
process.once('SIGTERM', closeServer);
