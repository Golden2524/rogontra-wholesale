import { authenticatedFetch, clearSession, getSession } from './auth-client.js';

const status = document.querySelector('.js-payment-return-status');
const reference = new URL(window.location.href).searchParams.get('reference');

if (!getSession()) {
  window.location.href = 'auth.html?returnTo=orders.html';
} else if (!reference) {
  status.textContent =
    'No payment reference was supplied. Return to your account to review the order.';
} else {
  try {
    const response = await authenticatedFetch(
      `/account/payments/${encodeURIComponent(reference)}/verify`,
      {
        method: 'POST'
      }
    );
    if (response.status === 401) {
      clearSession();
      window.location.href = 'auth.html?returnTo=orders.html';
    } else {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to verify this payment.');
      status.textContent = payload.data.paid
        ? 'Payment verified. Your order is ready for fulfilment.'
        : 'Payment is not complete yet. Your order remains awaiting payment.';
    }
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Unable to verify this payment.';
  }
}
