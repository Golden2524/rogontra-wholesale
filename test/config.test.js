import assert from 'node:assert/strict';
import test from 'node:test';

import { validateProductionConfiguration } from '../backend/src/config.js';

const validEnvironment = {
  DATABASE_URL: 'postgresql://user:password@db.example.com:5432/rogontra',
  JWT_SECRET: 'a-secure-production-secret-with-at-least-32-characters',
  CORS_ORIGIN: 'https://www.rogontra.example',
  PAYSTACK_SECRET_KEY: 'sk_test_example',
  PAYMENT_CALLBACK_URL: 'https://www.rogontra.example/payment-return.html'
};

test('accepts a complete production deployment configuration', () => {
  assert.deepEqual(validateProductionConfiguration(validEnvironment), []);
});

test('reports unsafe production deployment configuration without returning secret values', () => {
  const issues = validateProductionConfiguration({
    DATABASE_URL: 'https://example.com/not-a-database',
    JWT_SECRET: 'short',
    CORS_ORIGIN: 'http://localhost:5500',
    PAYSTACK_SECRET_KEY: 'sk_test_do_not_display'
  });

  assert.deepEqual(issues, [
    'DATABASE_URL must use the postgres or postgresql protocol.',
    'JWT_SECRET must be a unique value with at least 32 characters.',
    'CORS_ORIGIN must contain one or more exact HTTPS storefront origins.',
    'PAYSTACK_SECRET_KEY and PAYMENT_CALLBACK_URL must be configured together.'
  ]);
  assert.ok(!issues.join(' ').includes('sk_test_do_not_display'));
});

test('container deployment package keeps secrets and storefront assets out of the API image', async () => {
  const { readFile } = await import('node:fs/promises');
  const [dockerfile, dockerignore] = await Promise.all([
    readFile('Dockerfile', 'utf8'),
    readFile('.dockerignore', 'utf8')
  ]);

  assert.match(dockerfile, /FROM node:22-alpine/);
  assert.match(dockerfile, /npm ci --omit=dev/);
  assert.match(dockerfile, /backend\/src\/server\.js/);
  assert.match(dockerignore, /^\.env\.\*$/m);
  assert.match(dockerignore, /^styles$/m);
  assert.match(dockerignore, /^\*\.html$/m);
});

test('release scripts include a production dependency security audit', async () => {
  const packageJson = JSON.parse(
    await (await import('node:fs/promises')).readFile('package.json', 'utf8')
  );
  assert.equal(packageJson.scripts['audit:prod'], 'npm audit --omit=dev --audit-level=high');
});
