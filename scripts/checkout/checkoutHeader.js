import { cart } from '../../data/cart-class.js';

export function renderCheckoutHeader() {
  let checkoutHeaderHTML = '';

  const cartQuantity = cart.calculateCartQuantity();

  checkoutHeaderHTML += `
    <div class="checkout-header-left-section">
      <a href="index.html">
        <img class="amazon-logo" src="images/amazon-logo.png">
        <img class="amazon-mobile-logo" src="images/amazon-mobile-logo.png">
      </a>
    </div>

    <div class="checkout-header-middle-section">
      Checkout (<a class="return-to-home-link" href="amazon.html">${cartQuantity} items</a>)
    </div>

    <div class="checkout-header-right-section">
      <img src="images/icons/checkout-lock-icon.png">
    </div>
  `;

  document.querySelector('.js-header-content').innerHTML = checkoutHeaderHTML;
}
