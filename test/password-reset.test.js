import assert from 'node:assert/strict';
import test from 'node:test';

import { createPasswordResetService } from '../backend/src/password-reset.js';

function createRepository() {
  const user = { id: 'user-1', email: 'admin@example.com' };
  let reset;
  return {
    async findUserByEmail(email) {
      return email === user.email ? user : undefined;
    },
    async createPasswordResetToken(record) {
      reset = record;
    },
    async consumePasswordResetToken(record) {
      if (!reset || record.tokenHash !== reset.tokenHash) return false;
      reset = undefined;
      return true;
    }
  };
}

test('creates an expiring one-time reset link without exposing the token to storage', async () => {
  const repository = createRepository();
  let email;
  const service = createPasswordResetService({
    repository,
    resetUrl: 'https://rogontra.example/reset-password.html',
    sendResetEmail: async (message) => {
      email = message;
    }
  });

  await service.request({ email: 'ADMIN@example.com' });
  assert.equal(email.email, 'admin@example.com');
  assert.match(email.resetUrl, /^https:\/\/rogontra\.example\/reset-password\.html\?token=/);
  assert.equal(email.resetUrl.includes('token_hash'), false);

  const token = new URL(email.resetUrl).searchParams.get('token');
  await service.reset({ token, password: 'new-secure-password-123' });
  await assert.rejects(() => service.reset({ token, password: 'another-secure-password-123' }), {
    code: 'INVALID_RESET_TOKEN'
  });
});

test('does not reveal whether a requested email address has an account', async () => {
  const repository = createRepository();
  const service = createPasswordResetService({
    repository,
    resetUrl: 'https://rogontra.example/reset-password.html',
    sendResetEmail: async () => {
      throw new Error('Should not send for an unknown email.');
    }
  });

  await service.request({ email: 'unknown@example.com' });
});
