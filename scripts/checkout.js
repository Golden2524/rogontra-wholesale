import { renderOrderSummary } from './checkout/orderSummary.js';
import { renderCheckoutHeader } from './checkout/checkoutHeader.js';
import { renderPaymentSummary } from './checkout/paymentSummary.js';
import { loadProductsFetch, products } from '../data/products.js';
import { cart } from '../data/cart-class.js';

async function loadPage() {
  const status = document.querySelector('.js-checkout-status');
  try {
    await loadProductsFetch();
    cart.removeUnavailableItems(products.map((product) => product.id));
  } catch (_error) {
    status.textContent = 'We could not load the catalogue for order review. Please try again.';
    return;
  }

  renderOrderSummary();
  renderCheckoutHeader();
  renderPaymentSummary();
}

loadPage();
