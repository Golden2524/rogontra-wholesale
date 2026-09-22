import { randomUUID } from 'node:crypto';

import { createAuthService } from '../src/auth.js';
import { createDatabasePool } from '../src/database.js';
import { createDatabaseUserRepository } from '../src/database-users.js';

const pool = createDatabasePool();
const auth = createAuthService({
  repository: createDatabaseUserRepository(pool),
  secret: process.env.JWT_SECRET
});
const email = `integration-${randomUUID()}@rogontra.invalid`;
const password = `development-${randomUUID()}-password`;

try {
  const registration = await auth.register({
    displayName: 'Rogontra Integration Test',
    email,
    password
  });
  const login = await auth.login({ email, password });
  const identity = auth.verifyToken(login.token);

  console.info(
    JSON.stringify({
      registeredUserId: registration.user.id,
      loginUserId: login.user.id,
      tokenIdentityMatches: identity.id === registration.user.id
    })
  );
} finally {
  await pool.end();
}
