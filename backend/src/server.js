import { createApp } from './app.js';
import { getPort } from './config.js';
import { createDatabasePool } from './database.js';
import { createDatabaseCatalogue } from './database-catalogue.js';
import { createDatabasePersistence } from './database-persistence.js';
import { createAuthService } from './auth.js';
import { createDatabaseUserRepository } from './database-users.js';
import { createPaystackPaymentService } from './payments.js';
import { createDatabaseAdminCatalogue } from './database-admin.js';
import { createPasswordResetService } from './password-reset.js';
import { createResendEmailService } from './email.js';

const pool = createDatabasePool();
const userRepository = createDatabaseUserRepository(pool);
const emailService = createResendEmailService({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.PASSWORD_RESET_FROM_EMAIL
});
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
  auth: createAuthService({ repository: userRepository, secret: process.env.JWT_SECRET }),
  passwordReset: createPasswordResetService({
    repository: userRepository,
    resetUrl: process.env.PASSWORD_RESET_URL,
    sendResetEmail: emailService?.sendPasswordReset.bind(emailService)
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
