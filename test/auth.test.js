import assert from 'node:assert/strict';
import test from 'node:test';

import { createAuthService } from '../backend/src/auth.js';

function createMemoryRepository() {
  const users = new Map();
  return {
    async createUser(user) {
      if (users.has(user.email)) {
        const error = new Error('Exists');
        error.code = 'USER_EXISTS';
        throw error;
      }
      const saved = { ...user, id: `user-${users.size + 1}`, role: 'customer' };
      users.set(saved.email, saved);
      return saved;
    },
    async findUserByEmail(email) {
      return users.get(email);
    }
  };
}

test('registers a user without returning a password hash and verifies its token', async () => {
  const auth = createAuthService({
    repository: createMemoryRepository(),
    secret: 'test-secret-value'
  });
  const result = await auth.register({
    displayName: 'Ada Buyer',
    email: 'Ada@Example.com',
    password: 'secure-password-123'
  });

  assert.deepEqual(result.user, {
    id: 'user-1',
    email: 'ada@example.com',
    displayName: 'Ada Buyer',
    role: 'customer'
  });
  assert.equal(auth.verifyToken(result.token).email, 'ada@example.com');
  assert.equal(JSON.stringify(result).includes('password'), false);
});

test('rejects duplicate accounts and incorrect passwords', async () => {
  const auth = createAuthService({
    repository: createMemoryRepository(),
    secret: 'test-secret-value'
  });
  const input = {
    displayName: 'Ada Buyer',
    email: 'ada@example.com',
    password: 'secure-password-123'
  };
  await auth.register(input);

  await assert.rejects(() => auth.register(input), { code: 'EMAIL_IN_USE' });
  await assert.rejects(() => auth.login({ email: input.email, password: 'wrong-password-123' }), {
    code: 'INVALID_CREDENTIALS'
  });
});
