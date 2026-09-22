import { cart } from '../../data/cart-class.js';
import { clearSession, getSession } from '../auth-client.js';

export function renderCheckoutHeader() {
  let checkoutHeaderHTML = '';

  const cartQuantity = cart.calculateCartQuantity();
  const session = getSession();

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
      <a class="return-to-home-link" href="${session ? 'orders.html' : 'auth.html?returnTo=checkout.html'}">
        ${session ? 'Your orders' : 'Sign in'}
      </a>
      ${session ? '<button class="checkout-sign-out js-checkout-sign-out" type="button">Sign out</button>' : ''}
      <img src="images/icons/rogontra-secure.svg" alt="Secure order">
    </div>
  `;

  document.querySelector('.js-header-content').innerHTML = checkoutHeaderHTML;
  document.querySelector('.js-checkout-sign-out')?.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}
