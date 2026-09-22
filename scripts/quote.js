import { authenticatedFetch, getSession } from './auth-client.js';

const dialog = document.querySelector('.js-quote-dialog');
const form = document.querySelector('.js-quote-form');
const status = document.querySelector('.js-quote-status');

document.querySelectorAll('.js-request-quote').forEach((button) => {
  button.addEventListener('click', () => {
    if (!getSession()) {
      window.location.href = 'auth.html?returnTo=index.html';
      return;
    }
    form.productId.value = button.dataset.productId;
    document.querySelector('.js-quote-product-name').textContent = button.dataset.productName;
    status.textContent = '';
    dialog.showModal();
  });
});

document.querySelector('.js-close-quote').addEventListener('click', () => dialog.close());

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  status.textContent = 'Submitting request…';

  try {
    const response = await authenticatedFetch('/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to submit your request.');
    status.textContent = `Request received. Reference: ${payload.data.id}`;
    form.reset();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Unable to submit your request.';
  } finally {
    submit.disabled = false;
  }
});
