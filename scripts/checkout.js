import { renderOrderSummary } from './checkout/orderSummary.js';
import { renderCheckoutHeader } from './checkout/checkoutHeader.js';
import { renderPaymentSummary } from './checkout/paymentSummary.js';
import { loadProductsFetch } from '../data/products.js';

async function loadPage() {
  try {
    await loadProductsFetch();
  } catch (_error) {
    console.error('Unexpected error. Please try again later.');
  }

  renderOrderSummary();
  renderCheckoutHeader();
  renderPaymentSummary();
}

loadPage();
