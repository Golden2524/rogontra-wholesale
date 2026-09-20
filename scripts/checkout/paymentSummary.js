import { cart } from '../../data/cart-class.js';
import { getProduct } from '../../data/products.js';
import { getDeliveryOption } from '../../data/deliveryOption.js';
import formatCurrency from '../utils/money.js';
import { addOrder } from '../../data/order.js';

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
      <div>Shipping &amp; handling:</div>
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

    <button class="place-order-button button-primary
    js-place-order">
      Place your order
    </button>
  `;

  document.querySelector('.js-payment-summary').innerHTML = paymentSummaryHTML;

  //if cart is empty button should be disabled
  const cartIsEmpty = cart.cartItems.length === 0;
  const placeOrderButton = document.querySelector('.js-place-order');

  if (cartIsEmpty) {
    placeOrderButton.disabled = true;
  }

  document.querySelector('.js-place-order').addEventListener('click', async () => {
    const response = await fetch('https://supersimplebackend.dev/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cart: cart.cartItems
      })
    });

    const order = await response.json();
    addOrder(order);

    cart.resetCart();

    window.location.href = 'orders.html';
  });
}
