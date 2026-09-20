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
    const searchResponse = await fetch(`${baseUrl}/api/v1/products?q=basketball`);
    const searchProducts = await searchResponse.json();

    assert.equal(allResponse.status, 200);
    assert.ok(allProducts.meta.count > 0);
    assert.equal(searchResponse.status, 200);
    assert.equal(searchProducts.meta.count, 1);
    assert.match(searchProducts.data[0].name, /basketball/i);
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
