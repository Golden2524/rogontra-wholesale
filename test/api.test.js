import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../backend/src/app.js';

async function withApi(run) {
  const app = createApp({ allowedOrigins: ['http://localhost:5500'] });
  const server = app.listen(0);

  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('reports API health', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.service, 'rogontra-api');
    assert.equal(body.data.status, 'ok');
    assert.ok(Date.parse(body.data.timestamp));
  });
});

test('lists and searches the local Rogontra catalogue', async () => {
  await withApi(async (baseUrl) => {
    const allResponse = await fetch(`${baseUrl}/api/v1/products`);
    const allProducts = await allResponse.json();
    const searchResponse = await fetch(`${baseUrl}/api/v1/products?q=excavator`);
    const searchProducts = await searchResponse.json();

    assert.equal(allResponse.status, 200);
    assert.ok(allProducts.meta.count > 0);
    assert.equal(searchResponse.status, 200);
    assert.ok(searchProducts.meta.count >= 1);
    assert.ok(searchProducts.data.some((product) => /excavator/i.test(product.name)));
  });
});

test('returns consistent errors for invalid or missing resources', async () => {
  await withApi(async (baseUrl) => {
    const missingResponse = await fetch(`${baseUrl}/api/v1/products/not-a-product`);
    const invalidQueryResponse = await fetch(`${baseUrl}/api/v1/products?q=${'x'.repeat(101)}`);

    assert.equal(missingResponse.status, 404);
    assert.equal((await missingResponse.json()).error.code, 'PRODUCT_NOT_FOUND');
    assert.equal(invalidQueryResponse.status, 400);
    assert.equal((await invalidQueryResponse.json()).error.code, 'BAD_REQUEST');
  });
});

test('creates a server-priced test order from a valid cart', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: [
          {
            productId: 'rgw-cargo-straps-001',
            quantity: 2,
            deliveryOptionId: '2'
          }
        ]
      })
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.currency, 'USD');
    assert.equal(body.data.paymentStatus, 'not_collected');
    assert.equal(body.data.productPriceCents, 42400);
    assert.equal(body.data.shippingPriceCents, 499);
    assert.equal(body.data.taxCents, 4290);
    assert.equal(body.data.totalCostCents, 47189);
  });
});

test('rejects carts containing unknown products', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: [
          {
            productId: 'missing-product',
            quantity: 1,
            deliveryOptionId: '1'
          }
        ]
      })
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'CART_PRODUCT_NOT_FOUND');
  });
});

test('accepts a valid quote request for heavy equipment', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'rgw-excavator-001',
        quantity: 1,
        companyName: 'Example Procurement Ltd',
        contactName: 'Ada Buyer',
        email: 'ada@example.com',
        destinationCountry: 'Nigeria',
        notes: 'Need delivery estimate.'
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.data.status, 'received');
    assert.equal(body.data.productId, 'rgw-excavator-001');
  });
});
