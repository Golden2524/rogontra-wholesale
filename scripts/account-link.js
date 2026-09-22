import { getSession } from './auth-client.js';

const accountLink = document.querySelector('.js-account-link');

if (accountLink) {
  const session = getSession();
  if (session) {
    accountLink.href = 'orders.html';
    accountLink.querySelector('.js-account-label').textContent = 'Account';
    accountLink.querySelector('.js-account-action').textContent =
      session.user.displayName || 'Orders';
  }
}
