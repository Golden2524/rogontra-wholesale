import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../backend/src/app.js';
import { createPaystackPaymentService } from '../backend/src/payments.js';

test('Paystack adapter sends server-priced USD cents and returns provider checkout data', async () => {
  let request;
  const service = createPaystackPaymentService({
    callbackUrl: 'http://localhost:5500/payment-return.html',
    secretKey: 'sk_test_example',
    fetchImpl: async (_url, options) => {
      request = options;
      return {
        ok: true,
        json: async () => ({
          status: true,
          data: { authorization_url: 'https://checkout.example/pay', reference: 'rgw-reference' }
        })
      };
    }
  });

  const result = await service.initialize({
    amountCents: 47189,
    email: 'buyer@example.com',
    orderId: 'order-1'
  });

  assert.equal(request.headers.Authorization, 'Bearer sk_test_example');
  assert.deepEqual(JSON.parse(request.body), {
    amount: '47189',
    callback_url: 'http://localhost:5500/payment-return.html',
    currency: 'USD',
    email: 'buyer@example.com',
    metadata: '{"orderId":"order-1"}',
    reference: JSON.parse(request.body).reference
  });
  assert.equal(result.authorizationUrl, 'https://checkout.example/pay');
  assert.equal(result.reference, 'rgw-reference');
});

test('Paystack adapter fails safely when payments are unavailable or provider data is incomplete', async () => {
  const unconfigured = createPaystackPaymentService({});
  await assert.rejects(
    () =>
      unconfigured.initialize({ amountCents: 100, email: 'buyer@example.com', orderId: 'order-1' }),
    (error) => error.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED' && error.statusCode === 503
  );

  const incompleteResponse = createPaystackPaymentService({
    callbackUrl: 'https://rogontra.example/payment-return.html',
    secretKey: 'sk_test_example',
    fetchImpl: async () => ({ ok: true, json: async () => ({ status: true, data: {} }) })
  });
  await assert.rejects(
    () =>
      incompleteResponse.initialize({
        amountCents: 100,
        email: 'buyer@example.com',
        orderId: 'order-1'
      }),
    (error) => error.code === 'PAYMENT_PROVIDER_ERROR' && error.statusCode === 502
  );
});

test('Paystack adapter rejects failed provider responses and returns verification details', async () => {
  const unavailableProvider = createPaystackPaymentService({
    callbackUrl: 'https://rogontra.example/payment-return.html',
    secretKey: 'sk_test_example',
    fetchImpl: async () => ({ ok: false, json: async () => ({ status: false }) })
  });
  await assert.rejects(
    () => unavailableProvider.verify('payment-1'),
    (error) => error.code === 'PAYMENT_PROVIDER_ERROR' && error.statusCode === 502
  );

  const verifiedProvider = createPaystackPaymentService({
    callbackUrl: 'https://rogontra.example/payment-return.html',
    secretKey: 'sk_test_example',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        status: true,
        data: { amount: 47189, currency: 'USD', reference: 'payment-1', status: 'success' }
      })
    })
  });
  assert.deepEqual(await verifiedProvider.verify('payment-1'), {
    amountCents: 47189,
    currency: 'USD',
    providerReference: 'payment-1',
    status: 'success'
  });
});

test('payment routes tie initialization and verification to the signed-in order', async () => {
  const events = [];
  const app = createApp({
    allowedOrigins: ['http://localhost:5500'],
    auth: { verifyToken: () => ({ id: 'customer-1', email: 'buyer@example.com' }) },
    paymentService: {
      async initialize(input) {
        events.push(input);
        return { authorizationUrl: 'https://checkout.example/pay', reference: 'payment-1' };
      },
      async verify() {
        return {
          amountCents: 47189,
          currency: 'USD',
          providerReference: 'payment-1',
          status: 'success'
        };
      }
    },
    persistence: {
      async getOrderForUser() {
        return {
          id: 'order-1',
          totalCostCents: 47189,
          currency: 'USD',
          paymentStatus: 'not_collected',
          status: 'awaiting_payment'
        };
      },
      async createPaymentAttempt(attempt) {
        events.push(attempt);
      },
      async getPaymentAttemptForUser() {
        return {
          orderId: 'order-1',
          reference: 'payment-1',
          requestedCurrency: 'USD',
          requestedAmountCents: 47189
        };
      },
      async recordPaymentVerification(input) {
        events.push(input);
        return { paid: true, status: 'success' };
      }
    }
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/account`;
    const started = await fetch(`${baseUrl}/orders/order-1/payment`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token' }
    });
    const verified = await fetch(`${baseUrl}/payments/payment-1/verify`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token' }
    });

    assert.equal(started.status, 201);
    assert.deepEqual((await started.json()).data, {
      authorizationUrl: 'https://checkout.example/pay',
      reference: 'payment-1'
    });
    assert.deepEqual((await verified.json()).data, { paid: true, status: 'success' });
    assert.equal(events[0].amountCents, 47189);
    assert.equal(events[1].currency, 'USD');
    assert.equal(events[2].attempt.reference, 'payment-1');
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
