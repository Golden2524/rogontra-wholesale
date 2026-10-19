import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('checkout is explicit about provisional delivery and sends unsigned-in buyers to sign in', async () => {
  const [html, summary, payment] = await Promise.all([
    readFile('checkout.html', 'utf8'),
    readFile('scripts/checkout/orderSummary.js', 'utf8'),
    readFile('scripts/checkout/paymentSummary.js', 'utf8')
  ]);
  assert.match(html, /Dispatch dates, taxes, and delivery costs are reviewed before payment/);
  assert.match(html, /Delivery destination/);
  assert.match(html, /name="recipientName"/);
  assert.match(summary, /provisional delivery estimate/);
  assert.match(summary, /<label class="delivery-option/);
  assert.match(payment, /auth\.html\?returnTo=checkout\.html/);
  assert.match(payment, /Submit order for payment/);
  assert.match(payment, /deliveryAddress: Object\.fromEntries/);
});
