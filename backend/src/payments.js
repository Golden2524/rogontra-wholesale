import { randomUUID } from 'node:crypto';

function paymentError(code, message, statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function requireString(value, code, message) {
  if (typeof value !== 'string' || !value) throw paymentError(code, message, 502);
  return value;
}

export function createPaystackPaymentService({ callbackUrl, fetchImpl = fetch, secretKey }) {
  async function request(path, options) {
    const response = await fetchImpl(`https://api.paystack.co${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const payload = await response.json();
    if (!response.ok || !payload.status) {
      throw paymentError(
        'PAYMENT_PROVIDER_ERROR',
        'The payment provider could not process this request.',
        502
      );
    }
    return payload.data;
  }

  return {
    async initialize({ amountCents, email, orderId }) {
      if (!secretKey) {
        throw paymentError(
          'PAYMENT_PROVIDER_NOT_CONFIGURED',
          'Payments are not configured yet. Contact Rogontra for assistance.',
          503
        );
      }
      const reference = `rgw-${orderId}-${randomUUID()}`;
      const data = await request('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          amount: String(amountCents),
          callback_url: callbackUrl,
          currency: 'USD',
          email,
          metadata: JSON.stringify({ orderId }),
          reference
        })
      });
      return {
        authorizationUrl: requireString(
          data.authorization_url,
          'PAYMENT_PROVIDER_ERROR',
          'The provider did not return a checkout URL.'
        ),
        reference: requireString(
          data.reference,
          'PAYMENT_PROVIDER_ERROR',
          'The provider did not return a payment reference.'
        )
      };
    },

    async verify(reference) {
      if (!secretKey) {
        throw paymentError(
          'PAYMENT_PROVIDER_NOT_CONFIGURED',
          'Payments are not configured yet.',
          503
        );
      }
      const data = await request(`/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET'
      });
      return {
        amountCents: data.amount,
        currency: data.currency,
        providerReference: data.reference,
        status: data.status
      };
    }
  };
}
