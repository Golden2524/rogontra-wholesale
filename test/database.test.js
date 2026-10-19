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

test('second migration gives imported catalogue products a stable external ID', async () => {
  const sql = await readFile('backend/database/migrations/002_add_external_product_id.sql', 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE/);
});

test('admin migration separates catalogue controls from customer accounts', async () => {
  const sql = await readFile(
    'backend/database/migrations/004_add_admin_catalogue_controls.sql',
    'utf8'
  );
  assert.match(sql, /role IN \('customer', 'admin'\)/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS is_demo BOOLEAN/);
});

test('catalogue seed keeps illustrative products visibly marked as demo content', async () => {
  const script = await readFile('backend/scripts/seed-catalogue.js', 'utf8');
  assert.match(script, /name, description, price_cents/);
  assert.match(script, /VALUES \([^\n]*TRUE\)/);
  assert.match(script, /is_demo = TRUE/);
});

test('quote workflow migration limits statuses to the supported admin workflow', async () => {
  const sql = await readFile(
    'backend/database/migrations/005_constrain_quote_workflow_status.sql',
    'utf8'
  );
  assert.match(sql, /'received', 'reviewing', 'quoted', 'closed', 'cancelled'/);
});

test('order workflow migration protects payment and fulfilment status values', async () => {
  const sql = await readFile(
    'backend/database/migrations/006_constrain_order_workflow_status.sql',
    'utf8'
  );
  assert.match(sql, /'awaiting_payment', 'preparing', 'dispatched', 'delivered', 'cancelled'/);
  assert.match(sql, /'not_collected', 'paid', 'failed', 'refunded'/);
});

test('payment attempts track only supported payment lifecycle statuses', async () => {
  const sql = await readFile(
    'backend/database/migrations/007_add_payment_attempt_workflow.sql',
    'utf8'
  );
  assert.match(sql, /'initialized', 'pending', 'success', 'failed'/);
  assert.match(sql, /payment_attempts_order_id_idx/);
});

test('delivery snapshots preserve order fulfilment destinations', async () => {
  const sql = await readFile(
    'backend/database/migrations/008_add_order_delivery_snapshot.sql',
    'utf8'
  );
  assert.match(sql, /ADD COLUMN IF NOT EXISTS delivery_address JSONB/);
});

test('database catalogue search includes stored product keywords', async () => {
  const source = await readFile('backend/src/database-catalogue.js', 'utf8');
  assert.match(source, /p\.specifications::text ILIKE/);
});
