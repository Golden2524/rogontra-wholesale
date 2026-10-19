import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../backend/src/app.js';

async function withApi(run) {
  const app = createApp({
    allowedOrigins: ['http://localhost:5500'],
    auth: { verifyToken: () => ({ id: 'test-user-id', email: 'buyer@example.com' }) }
  });
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

const deliveryAddress = {
  addressLine1: '1 Marina Road',
  city: 'Lagos',
  country: 'Nigeria',
  phone: '+2348012345678',
  recipientName: 'Ada Buyer'
};

test('reports API health', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.service, 'rogontra-api');
    assert.equal(body.data.status, 'ok');
    assert.ok(Date.parse(body.data.timestamp));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/i);
  });
});

test('includes a request ID on API errors without exposing server internals', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/products?q=${'x'.repeat(101)}`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.requestId, response.headers.get('x-request-id'));
    assert.equal(body.error.message, 'Query parameter "q" must be 100 characters or fewer.');
  });
});

test('reports readiness separately from process health', async () => {
  const readyApp = createApp({ readiness: async () => true });
  const unavailableApp = createApp({
    readiness: async () => {
      throw new Error('Database unavailable');
    }
  });
  const readyServer = readyApp.listen(0);
  const unavailableServer = unavailableApp.listen(0);
  await Promise.all([
    new Promise((resolve) => readyServer.once('listening', resolve)),
    new Promise((resolve) => unavailableServer.once('listening', resolve))
  ]);

  try {
    const ready = await fetch(`http://127.0.0.1:${readyServer.address().port}/api/v1/ready`);
    const unavailable = await fetch(
      `http://127.0.0.1:${unavailableServer.address().port}/api/v1/ready`
    );
    assert.equal(ready.status, 200);
    assert.equal((await ready.json()).data.status, 'ready');
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.json()).error.code, 'SERVICE_NOT_READY');
  } finally {
    await Promise.all(
      [readyServer, unavailableServer].map(
        (server) =>
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
          )
      )
    );
  }
});

test('storefront quote controls use delegated events for asynchronously loaded products', async () => {
  const script = await import('node:fs/promises').then(({ readFile }) =>
    readFile('scripts/quote.js', 'utf8')
  );
  assert.match(script, /document\.addEventListener\('click'/);
  assert.match(script, /closest\('\.js-request-quote'\)/);
});

test('lists and searches the local Rogontra catalogue', async () => {
  await withApi(async (baseUrl) => {
    const allResponse = await fetch(`${baseUrl}/api/v1/products`);
    const allProducts = await allResponse.json();
    const searchResponse = await fetch(`${baseUrl}/api/v1/products?q=excavator`);
    const searchProducts = await searchResponse.json();
    const keywordResponse = await fetch(`${baseUrl}/api/v1/products?q=ppe`);
    const keywordProducts = await keywordResponse.json();
    const categoryResponse = await fetch(`${baseUrl}/api/v1/products?category=Industrial%20Parts`);
    const categoryProducts = await categoryResponse.json();

    assert.equal(allResponse.status, 200);
    assert.ok(allProducts.meta.count > 0);
    assert.equal(searchResponse.status, 200);
    assert.ok(searchProducts.meta.count >= 1);
    assert.ok(searchProducts.data.some((product) => /excavator/i.test(product.name)));
    assert.ok(keywordProducts.data.some((product) => product.category === 'Safety & PPE'));
    assert.equal(categoryResponse.status, 200);
    assert.equal(categoryProducts.meta.category, 'Industrial Parts');
    assert.ok(categoryProducts.data.every((product) => product.category === 'Industrial Parts'));
  });
});

test('returns consistent errors for invalid or missing resources', async () => {
  await withApi(async (baseUrl) => {
    const missingResponse = await fetch(`${baseUrl}/api/v1/products/not-a-product`);
    const invalidQueryResponse = await fetch(`${baseUrl}/api/v1/products?q=${'x'.repeat(101)}`);
    const invalidCategoryResponse = await fetch(
      `${baseUrl}/api/v1/products?category=${'x'.repeat(101)}`
    );

    assert.equal(missingResponse.status, 404);
    assert.equal((await missingResponse.json()).error.code, 'PRODUCT_NOT_FOUND');
    assert.equal(invalidQueryResponse.status, 400);
    assert.equal((await invalidQueryResponse.json()).error.code, 'BAD_REQUEST');
    assert.equal(invalidCategoryResponse.status, 400);
    assert.equal((await invalidCategoryResponse.json()).error.code, 'BAD_REQUEST');
  });
});

test('creates a server-priced test order from a valid cart', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        cart: [
          {
            productId: 'rgw-cargo-straps-001',
            quantity: 2,
            deliveryOptionId: '2'
          }
        ],
        deliveryAddress
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
    assert.equal(body.data.deliveryAddress.recipientName, deliveryAddress.recipientName);
    assert.equal(body.data.deliveryAddress.country, deliveryAddress.country);
    assert.equal(body.data.deliveryAddress.addressLine2, '');
    assert.equal(body.data.deliveryAddress.postalCode, '');
  });
});

test('rejects carts containing unknown products', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        cart: [
          {
            productId: 'missing-product',
            quantity: 1,
            deliveryOptionId: '1'
          }
        ],
        deliveryAddress
      })
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'CART_PRODUCT_NOT_FOUND');
  });
});

test('enforces a product minimum order quantity on the server', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        cart: [{ productId: 'rgw-safety-gloves-001', quantity: 1, deliveryOptionId: '1' }],
        deliveryAddress
      })
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'MINIMUM_ORDER_QUANTITY_NOT_MET');
  });
});

test('requires a complete delivery destination before creating an order', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        cart: [{ productId: 'rgw-cargo-straps-001', quantity: 1, deliveryOptionId: '1' }]
      })
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_DELIVERY_ADDRESS');
  });
});

test('accepts a valid quote request for heavy equipment', async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
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
