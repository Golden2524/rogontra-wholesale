import { cart } from '../../data/cart-class.js';
import { getProduct } from '../../data/products.js';
import formatCurrency from '../utils/money.js';
import {
  deliveryOptions,
  getDeliveryOption,
  calculateDeliveryDate
} from '../../data/deliveryOption.js';
import { renderCheckoutHeader } from './checkoutHeader.js';
import { renderPaymentSummary } from './paymentSummary.js';

export function renderOrderSummary() {
  let cartSummaryHTML = '';

  const cartSummary = document.querySelector('.js-order-summary');
  const cartIsEmpty = cart.cartItems.length === 0;

  if (cartIsEmpty) {
    cartSummary.innerHTML = `
      <div class="">
        Your cart is empty
      </div>

      <a href="index.html"> 
        <button class="button-primary view-products-link">
          View products
        </button>
      </a>  
    `;
    return;
  }

  cart.cartItems.forEach((cartItem) => {
    const productId = cartItem.productId;
    const matchingProduct = getProduct(productId);

    const deliveryOptionId = cartItem.deliveryOptionId;
    const deliveryOption = getDeliveryOption(deliveryOptionId);

    const dateString = calculateDeliveryDate(deliveryOption);

    cartSummaryHTML += `
      <div class="cart-item-container js-cart-item-container-${matchingProduct.id}">
        <div class="delivery-date">
          Estimated arrival: ${dateString}
        </div>

        <div class="cart-item-details-grid">
          <img class="product-image"
            src="${matchingProduct.image}" alt="${matchingProduct.name}">

          <div class="cart-item-details">
            <div class="product-name">
              ${matchingProduct.name}
            </div>
            <div class="product-price">
              $${formatCurrency(matchingProduct.priceCents)}
            </div>
            <div class="product-quantity">
              <span>
                Quantity: <span class="quantity-label js-quantity-label-${matchingProduct.id}">${cartItem.quantity}</span>
              </span>
              <button type="button" class="update-quantity-link link-primary
              js-update-quantity-link"
              data-product-id="${matchingProduct.id}">
                Update
              </button>
              <input class="quantity-input js-quantity-input-${matchingProduct.id}" type="number" min="1" max="999" aria-label="New quantity for ${matchingProduct.name}">
              <button type="button" class="save-quantity-link link-primary
              js-save-quantity-link"
              data-product-id="${matchingProduct.id}">Save</button>
              <button type="button" class="delete-quantity-link link-primary
              js-delete-quantity"
              data-product-id="${matchingProduct.id}">
                Delete
              </button>
            </div>
          </div>

          <div class="delivery-options">
            <div class="delivery-options-title">
              Choose a provisional delivery estimate:
            </div>
            ${deliveryOptionsHTML(matchingProduct, cartItem)}
          </div>
        </div>
      </div>
    `;
  });

  function deliveryOptionsHTML(matchingProduct, cartItem) {
    let html = '';

    deliveryOptions.forEach((deliveryOption) => {
      const dateString = calculateDeliveryDate(deliveryOption);

      const priceString =
        deliveryOption.shippingPriceCents === 0
          ? 'FREE'
          : `$${formatCurrency(deliveryOption.shippingPriceCents)} -`;

      const isChecked = deliveryOption.id === cartItem.deliveryOptionId;

      html += `
        <label class="delivery-option js-delivery-option"
        data-product-id="${matchingProduct.id}"
        data-delivery-option-id="${deliveryOption.id}">
          <input type="radio" ${isChecked ? 'checked' : ''}
            class="delivery-option-input"
            name="delivery-option-${matchingProduct.id}"
            aria-label="${dateString}, ${priceString} shipping"
          >
          <div>
            <div class="delivery-option-date">
              ${dateString}
            </div>
            <div class="delivery-option-price">
              ${priceString} delivery estimate
            </div>
          </div>
        </label>
      `;
    });

    return html;
  }

  document.querySelector('.js-order-summary').innerHTML = cartSummaryHTML;

  document.querySelectorAll('.js-delivery-option').forEach((option) => {
    option.addEventListener('click', () => {
      const { productId, deliveryOptionId } = option.dataset;
      cart.updateDeliveryOption(productId, deliveryOptionId);

      renderOrderSummary();
      renderPaymentSummary();
    });
  });

  document.querySelectorAll('.js-delete-quantity').forEach((element) => {
    element.addEventListener('click', () => {
      const productId = element.dataset.productId;
      cart.removeFromCart(productId);

      const container = document.querySelector(`.js-cart-item-container-${productId}`);
      container.remove();

      renderOrderSummary();
      renderCheckoutHeader();
      renderPaymentSummary();
    });
  });

  document.querySelectorAll('.js-update-quantity-link').forEach((element) => {
    element.addEventListener('click', () => {
      const productId = element.dataset.productId;

      const container = document.querySelector(`.js-cart-item-container-${productId}`);
      container.classList.add('is-editing-quantity');
    });
  });

  document.querySelectorAll('.js-save-quantity-link').forEach((link) => {
    link.addEventListener('click', () => {
      const productId = link.dataset.productId;

      const inputQuantity = document.querySelector(`.js-quantity-input-${productId}`);
      const newQuantity = Number(inputQuantity.value);

      if (newQuantity < 1 || newQuantity >= 1000) {
        alert('Quantity must be at least 1 and less than 1000');
        return;
      } else if (!Number.isInteger(newQuantity)) {
        alert('Quantity must be a whole number');
        return;
      }

      cart.updateQuantity(productId, newQuantity);

      const container = document.querySelector(`.js-cart-item-container-${productId}`);
      container.classList.remove('is-editing-quantity');

      const quantityLabel = document.querySelector(`.js-quantity-label-${productId}`);
      quantityLabel.innerHTML = newQuantity;

      renderOrderSummary();
      renderCheckoutHeader();
      renderPaymentSummary();
    });
  });
}
