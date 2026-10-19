import { cart } from '../../data/cart-class.js';
import { getProduct } from '../../data/products.js';
import { getDeliveryOption } from '../../data/deliveryOption.js';
import formatCurrency from '../utils/money.js';
import { addOrder } from '../../data/order.js';
import { authenticatedFetch, getSession } from '../auth-client.js';

export function renderPaymentSummary() {
  let productPriceCent = 0;
  let shippingPriceCent = 0;

  const cartQuantity = cart.calculateCartQuantity();

  cart.cartItems.forEach((cartItem) => {
    const product = getProduct(cartItem.productId);
    productPriceCent += product.priceCents * cartItem.quantity;

    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    shippingPriceCent += deliveryOption.shippingPriceCents;
  });

  const totalBeforeTax = productPriceCent + shippingPriceCent;
  const estimatedTax = totalBeforeTax * 0.1;
  const orderTotal = totalBeforeTax + estimatedTax;

  const paymentSummaryHTML = `
    <div class="payment-summary-title">
      Order Summary
    </div>

    <div class="payment-summary-row">
      <div>Items (${cartQuantity}):</div>
      <div class="payment-summary-money">$${formatCurrency(productPriceCent)}</div>
    </div>

    <div class="payment-summary-row">
      <div>Estimated delivery:</div>
      <div class="payment-summary-money">$${formatCurrency(shippingPriceCent)}</div>
    </div>

    <div class="payment-summary-row subtotal-row">
      <div>Total before tax:</div>
      <div class="payment-summary-money">$${formatCurrency(totalBeforeTax)}</div>
    </div>

    <div class="payment-summary-row">
      <div>Estimated tax (10%):</div>
      <div class="payment-summary-money">$${formatCurrency(estimatedTax)}</div>
    </div>

    <div class="payment-summary-row total-row">
      <div>Order total:</div>
      <div class="payment-summary-money">$${formatCurrency(orderTotal)}</div>
    </div>

    <p class="payment-summary-note">The final payment is verified server-side. This development checkout uses illustrative taxes and delivery estimates.</p>
    <button class="place-order-button button-primary js-place-order">
      ${getSession() ? 'Submit order for payment' : 'Sign in to submit order'}
    </button>
    <p class="js-payment-message" role="status"></p>
  `;

  document.querySelector('.js-payment-summary').innerHTML = paymentSummaryHTML;

  //if cart is empty button should be disabled
  const cartIsEmpty = cart.cartItems.length === 0;
  const placeOrderButton = document.querySelector('.js-place-order');

  if (cartIsEmpty) {
    placeOrderButton.disabled = true;
  }

  document.querySelector('.js-place-order').addEventListener('click', async () => {
    if (!getSession()) {
      window.location.href = 'auth.html?returnTo=checkout.html';
      return;
    }

    const paymentMessage = document.querySelector('.js-payment-message');
    const deliveryAddressForm = document.querySelector('.js-delivery-address-form');
    if (!deliveryAddressForm.reportValidity()) return;
    placeOrderButton.disabled = true;
    placeOrderButton.textContent = 'Submitting…';
    paymentMessage.textContent = '';

    try {
      const response = await authenticatedFetch('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart: cart.cartItems,
          deliveryAddress: Object.fromEntries(new FormData(deliveryAddressForm))
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to submit the test order.');
      }

      addOrder(payload.data);
      cart.resetCart();
      window.location.href = 'orders.html';
    } catch (error) {
      paymentMessage.textContent =
        error instanceof Error ? error.message : 'Unable to submit the test order.';
      placeOrderButton.disabled = false;
      placeOrderButton.textContent = 'Submit order for payment';
    }
  });
}
