import { cart } from '../../data/cart-class.js';

export function renderCheckoutHeader() {
  let checkoutHeaderHTML = '';

  const cartQuantity = cart.calculateCartQuantity();

  checkoutHeaderHTML += `
    <div class="checkout-header-left-section">
      <a href="index.html">
        <img class="rogontra-logo" src="images/rogontra-logo-dark.svg" alt="Rogontra Wholesale">
        <img class="rogontra-mobile-logo" src="images/rogontra-mark.svg" alt="Rogontra">
      </a>
    </div>

    <div class="checkout-header-middle-section">
      Secure review (<a class="return-to-home-link" href="index.html">${cartQuantity} items</a>)
    </div>

    <div class="checkout-header-right-section">
      <img src="images/icons/rogontra-secure.svg" alt="Secure order">
    </div>
  `;

  document.querySelector('.js-header-content').innerHTML = checkoutHeaderHTML;
}
