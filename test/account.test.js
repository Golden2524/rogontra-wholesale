import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../backend/src/app.js';
import { readFile } from 'node:fs/promises';

test('account order rendering displays a safe delivery destination snapshot', async () => {
  const script = await readFile('scripts/order.js', 'utf8');
  assert.match(script, /order\.deliveryAddress/);
  assert.match(script, /escapeHtml\(order\.deliveryAddress\.country\)/);
});

test('tracking uses the authenticated order API and does not invent shipment progress', async () => {
  const [tracking, orders, auth] = await Promise.all([
    readFile('scripts/tracking.js', 'utf8'),
    readFile('scripts/order.js', 'utf8'),
    readFile('scripts/auth-page.js', 'utf8')
  ]);
  assert.match(tracking, /authenticatedFetch\(`\/account\/orders\//);
  assert.match(tracking, /Shipping progress becomes available after payment verification/);
  assert.match(orders, /Tracking is available after fulfilment starts/);
  assert.match(auth, /tracking\\\.html/);
});

test('account history has a safe API failure state', async () => {
  const script = await readFile('scripts/order.js', 'utf8');
  assert.match(script, /loadPage\(\)\.catch/);
  assert.match(script, /Your orders could not be loaded/);
});

test('customer history endpoints require a bearer token and scope results to the session user', async () => {
  const requestedUsers = [];
  const app = createApp({
    allowedOrigins: ['http://localhost:5500'],
    auth: { verifyToken: () => ({ id: 'customer-1', email: 'buyer@example.com' }) },
    persistence: {
      async listOrdersForUser(userId) {
        requestedUsers.push(userId);
        return [{ id: 'order-1' }];
      },
      async listQuotesForUser(userId) {
        requestedUsers.push(userId);
        return [{ id: 'quote-1' }];
      },
      async getOrderForUser(userId, orderId) {
        requestedUsers.push(userId);
        return orderId === 'order-1' ? { id: orderId } : undefined;
      }
    }
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api/v1/account`;
    const denied = await fetch(`${baseUrl}/orders`);
    const orders = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: 'Bearer test-token' }
    });
    const quotes = await fetch(`${baseUrl}/quotes`, {
      headers: { Authorization: 'Bearer test-token' }
    });
    const order = await fetch(`${baseUrl}/orders/order-1`, {
      headers: { Authorization: 'Bearer test-token' }
    });
    const missingOrder = await fetch(`${baseUrl}/orders/not-found`, {
      headers: { Authorization: 'Bearer test-token' }
    });

    assert.equal(denied.status, 401);
    assert.deepEqual((await orders.json()).data, [{ id: 'order-1' }]);
    assert.deepEqual((await quotes.json()).data, [{ id: 'quote-1' }]);
    assert.deepEqual((await order.json()).data, { id: 'order-1' });
    assert.equal(missingOrder.status, 404);
    assert.equal((await missingOrder.json()).error.code, 'ORDER_NOT_FOUND');
    assert.deepEqual(requestedUsers, ['customer-1', 'customer-1', 'customer-1', 'customer-1']);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
