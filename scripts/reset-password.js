import { API_BASE_URL } from './config.js';

const form = document.querySelector('.js-new-password-form');
const submit = document.querySelector('.js-new-password-submit');
const status = document.querySelector('.js-new-password-status');
const token = new URLSearchParams(window.location.search).get('token');

if (!token) {
  submit.disabled = true;
  status.textContent = 'This password-reset link is invalid or incomplete.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!token) return;
  const fields = Object.fromEntries(new FormData(form));
  if (fields.password !== fields.confirmPassword) {
    status.textContent = 'The new passwords do not match.';
    return;
  }
  submit.disabled = true;
  status.textContent = 'Saving your new password…';
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: fields.password })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to reset your password.');
    status.textContent = 'Password reset. Redirecting you to sign in…';
    window.setTimeout(() => {
      window.location.href = 'auth.html';
    }, 900);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Unable to reset your password.';
    submit.disabled = false;
  }
});
