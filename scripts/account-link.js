import { clearSession, getSession } from './auth-client.js';

const accountLink = document.querySelector('.js-account-link');
const signOutButton = document.querySelector('.js-sign-out');

const session = getSession();

if (accountLink && session) {
  accountLink.href = 'orders.html';
  accountLink.querySelector('.js-account-label').textContent = 'Account';
  accountLink.querySelector('.js-account-action').textContent =
    session.user.displayName || 'Orders';
}

if (signOutButton && session) {
  signOutButton.hidden = false;
  signOutButton.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}
