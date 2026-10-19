import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../backend/src/app.js';
import { readFile } from 'node:fs/promises';

test('the protected order desk renders a delivery destination only from admin order data', async () => {
  const [persistence, admin] = await Promise.all([
    readFile('backend/src/database-persistence.js', 'utf8'),
    readFile('scripts/admin.js', 'utf8')
  ]);
  assert.match(persistence, /o\.delivery_address/);
  assert.match(admin, /admin-delivery-address/);
  assert.match(admin, /order\.deliveryAddress\.recipientName/);
});

test('admin workspace is explicitly labelled as pre-launch', async () => {
  const html = await readFile('admin.html', 'utf8');
  assert.match(html, /Pre-launch workspace/);
  assert.match(html, /payment settings must be replaced and verified/);
});

test('admin catalogue endpoints reject customers and accept administrators', async () => {
  const app = createApp({
    allowedOrigins: ['http://localhost:5500'],
    auth: {
      verifyAdminToken: async (token) => ({
        id: 'user-1',
        role: token === 'admin-token' ? 'admin' : 'customer'
      })
    },
    adminCatalogue: {
      async listProducts() {
        return [{ externalId: 'rgw-test-001' }];
      },
      async createProduct(input) {
        return input;
      }
    },
    persistence: {
      async listQuotesForAdmin() {
        return [{ id: 'quote-1', status: 'received' }];
      },
      async updateQuoteStatus(quoteId, status) {
        return quoteId === 'quote-1' ? { id: quoteId, status } : undefined;
      },
      async listOrdersForAdmin() {
        return [{ id: 'order-1', status: 'awaiting_payment', paymentStatus: 'not_collected' }];
      },
      async updateOrderStatus(orderId, status) {
        return orderId === 'order-1' ? { id: orderId, status } : undefined;
      }
    }
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/admin/products`;
    const missing = await fetch(baseUrl);
    const customer = await fetch(baseUrl, { headers: { Authorization: 'Bearer customer-token' } });
    const administrator = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer admin-token' }
    });
    const quotes = await fetch(`${baseUrl.replace('/products', '/quotes')}`, {
      headers: { Authorization: 'Bearer admin-token' }
    });
    const updatedQuote = await fetch(`${baseUrl.replace('/products', '/quotes/quote-1')}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewing' })
    });
    const orders = await fetch(`${baseUrl.replace('/products', '/orders')}`, {
      headers: { Authorization: 'Bearer admin-token' }
    });
    const updatedOrder = await fetch(`${baseUrl.replace('/products', '/orders/order-1')}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });

    assert.equal(missing.status, 401);
    assert.equal(customer.status, 403);
    assert.deepEqual((await administrator.json()).data, [{ externalId: 'rgw-test-001' }]);
    assert.deepEqual((await quotes.json()).data, [{ id: 'quote-1', status: 'received' }]);
    assert.deepEqual((await updatedQuote.json()).data, { id: 'quote-1', status: 'reviewing' });
    assert.deepEqual((await orders.json()).data, [
      { id: 'order-1', status: 'awaiting_payment', paymentStatus: 'not_collected' }
    ]);
    assert.deepEqual((await updatedOrder.json()).data, { id: 'order-1', status: 'cancelled' });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
