import { API_BASE_URL } from './config.js';

const form = document.querySelector('.js-password-reset-request-form');
const submit = document.querySelector('.js-password-reset-submit');
const status = document.querySelector('.js-password-reset-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submit.disabled = true;
  status.textContent = 'Sending reset instructions…';
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to request a reset link.');
    status.textContent = payload.data.message;
    form.reset();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Unable to request a reset link.';
  } finally {
    submit.disabled = false;
  }
});
