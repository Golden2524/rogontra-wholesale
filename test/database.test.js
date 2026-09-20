import assert from 'node:assert/strict';
import test from 'node:test';

import { readFile } from 'node:fs/promises';

test('initial migration protects Rogontra money and quote-only product invariants', async () => {
  const sql = await readFile('backend/database/migrations/001_initial_schema.sql', 'utf8');

  assert.match(sql, /currency CHAR\(3\) NOT NULL DEFAULT 'USD' CHECK \(currency = 'USD'\)/);
  assert.match(sql, /purchase_mode IN \('checkout', 'quote'\)/);
  assert.match(sql, /purchase_mode = 'quote' AND price_cents IS NULL/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS payment_attempts/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS quote_requests/);
});
