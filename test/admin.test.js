import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../backend/src/app.js';

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

    assert.equal(missing.status, 401);
    assert.equal(customer.status, 403);
    assert.deepEqual((await administrator.json()).data, [{ externalId: 'rgw-test-001' }]);
    assert.deepEqual((await quotes.json()).data, [{ id: 'quote-1', status: 'received' }]);
    assert.deepEqual((await updatedQuote.json()).data, { id: 'quote-1', status: 'reviewing' });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
