import { renderOrderSummary } from './checkout/orderSummary.js';
import { renderCheckoutHeader } from './checkout/checkoutHeader.js';
import { renderPaymentSummary } from './checkout/paymentSummary.js';
import { loadProductsFetch, products } from '../data/products.js';
import { cart } from '../data/cart-class.js';

async function loadPage() {
  try {
    await loadProductsFetch();
    cart.removeUnavailableItems(products.map((product) => product.id));
  } catch (_error) {
    console.error('Unexpected error. Please try again later.');
  }

  renderOrderSummary();
  renderCheckoutHeader();
  renderPaymentSummary();
}

loadPage();
