import { API_BASE_URL } from './config.js';
import { saveSession } from './auth-client.js';

const form = document.querySelector('.js-auth-form');
const title = document.querySelector('#auth-title');
const question = document.querySelector('.js-toggle-question');
const toggle = document.querySelector('.js-auth-toggle');
const displayNameField = document.querySelector('.js-display-name-field');
const password = form.elements.password;
const status = document.querySelector('.js-auth-status');
let mode = 'register';

function getReturnPath() {
  const path = new URLSearchParams(window.location.search).get('returnTo');
  if (['index.html', 'checkout.html', 'orders.html', 'admin.html'].includes(path)) return path;
  if (/^product\.html\?productId=[a-z0-9][a-z0-9-]{2,99}$/i.test(path ?? '')) return path;
  if (
    /^tracking\.html\?orderId=[0-9a-f-]{36}&productId=[a-z0-9][a-z0-9-]{2,99}$/i.test(path ?? '')
  ) {
    return path;
  }
  return 'orders.html';
}

function renderMode() {
  const signingIn = mode === 'login';
  title.textContent = signingIn ? 'Sign in' : 'Create an account';
  displayNameField.hidden = signingIn;
  displayNameField.querySelector('input').required = !signingIn;
  password.autocomplete = signingIn ? 'current-password' : 'new-password';
  document.querySelector('.js-auth-submit').textContent = signingIn ? 'Sign in' : 'Create account';
  question.textContent = signingIn ? 'New to Rogontra?' : 'Already have an account?';
  toggle.textContent = signingIn ? 'Create an account' : 'Sign in';
  status.textContent = '';
}

toggle.addEventListener('click', () => {
  mode = mode === 'login' ? 'register' : 'login';
  renderMode();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = document.querySelector('.js-auth-submit');
  submit.disabled = true;
  status.textContent = 'Verifying secure account details…';

  try {
    const fields = Object.fromEntries(new FormData(form));
    const response = await fetch(
      `${API_BASE_URL}/auth/${mode === 'login' ? 'login' : 'register'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      }
    );
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error?.message ?? 'Unable to complete authentication.');
    saveSession(payload.data);
    window.location.href = getReturnPath();
  } catch (error) {
    status.textContent =
      error instanceof Error ? error.message : 'Unable to complete authentication.';
  } finally {
    submit.disabled = false;
  }
});

renderMode();
