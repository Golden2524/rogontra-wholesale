import { authenticatedFetch, clearSession, getSession } from './auth-client.js';

const session = getSession();
const form = document.querySelector('.js-product-form');
const status = document.querySelector('.js-admin-status');
const list = document.querySelector('.js-admin-product-list');
const count = document.querySelector('.js-product-count');
const title = document.querySelector('.js-product-form-title');
const cancelEdit = document.querySelector('.js-cancel-edit');
const quoteList = document.querySelector('.js-admin-quote-list');
const quoteCount = document.querySelector('.js-quote-count');
const orderList = document.querySelector('.js-admin-order-list');
const orderCount = document.querySelector('.js-order-count');
let products = [];
let quotes = [];
let orders = [];
let editingExternalId;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#a61b1b' : '#087f78';
}

function resetForm() {
  editingExternalId = undefined;
  form.reset();
  form.elements.minimumOrderQuantity.value = '1';
  form.elements.specifications.value = '{}';
  form.elements.isActive.checked = true;
  form.elements.externalId.disabled = false;
  title.textContent = 'Add a product';
  cancelEdit.hidden = true;
  form.querySelector('.js-save-product').textContent = 'Save product';
}

function renderProducts() {
  count.textContent = `${products.length} total`;
  list.innerHTML = products
    .map(
      (product) => `
        <article class="admin-product-row">
          <img src="${escapeHtml(product.image)}" alt="" />
          <div class="admin-product-copy">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.externalId)} · ${escapeHtml(product.sku)} · ${escapeHtml(product.category)}</p>
            <div class="admin-product-tags">
              ${product.isDemo ? '<span class="admin-product-tag demo">Demo content</span>' : ''}
              <span class="admin-product-tag">${product.isActive ? 'Visible' : 'Hidden'}</span>
              <span class="admin-product-tag">${escapeHtml(product.purchaseMode)}</span>
            </div>
          </div>
          <button class="edit-product-button" type="button" data-product-id="${escapeHtml(product.externalId)}">Edit</button>
        </article>
      `
    )
    .join('');

  list.querySelectorAll('.edit-product-button').forEach((button) => {
    button.addEventListener('click', () => {
      const product = products.find((item) => item.externalId === button.dataset.productId);
      if (!product) return;
      editingExternalId = product.externalId;
      form.elements.externalId.value = product.externalId;
      form.elements.externalId.disabled = true;
      form.elements.sku.value = product.sku;
      form.elements.name.value = product.name;
      form.elements.category.value = product.category;
      form.elements.image.value = product.image;
      form.elements.description.value = product.description;
      form.elements.purchaseMode.value = product.purchaseMode;
      form.elements.priceCents.value = product.priceCents ?? '';
      form.elements.condition.value = product.condition;
      form.elements.minimumOrderQuantity.value = product.minimumOrderQuantity;
      form.elements.stockStatus.value = product.stockStatus;
      form.elements.keywords.value = product.keywords.join(', ');
      form.elements.specifications.value = JSON.stringify(product.specifications, null, 2);
      form.elements.isActive.checked = product.isActive;
      title.textContent = `Edit ${product.name}`;
      cancelEdit.hidden = false;
      form.querySelector('.js-save-product').textContent = 'Save changes';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderQuotes() {
  quoteCount.textContent = `${quotes.length} total`;
  if (quotes.length === 0) {
    quoteList.innerHTML =
      '<p class="admin-empty-state">No quote requests have been submitted yet.</p>';
    return;
  }
  quoteList.innerHTML = quotes
    .map(
      (quote) => `
        <article class="admin-quote-card">
          <h3>${escapeHtml(quote.productName)}</h3>
          <p class="admin-quote-summary"><strong>${escapeHtml(quote.companyName)}</strong> · ${escapeHtml(quote.contactName)} · ${escapeHtml(quote.email)}</p>
          <p class="admin-quote-summary">${quote.quantity} requested · ${escapeHtml(quote.destinationCountry)} · Submitted ${new Date(quote.createdAt).toLocaleDateString()}</p>
          ${quote.notes ? `<p class="admin-quote-notes">${escapeHtml(quote.notes)}</p>` : ''}
          <div class="admin-quote-footer">
            <span class="admin-product-tag">Reference: ${escapeHtml(quote.id)}</span>
            <label>Workflow status
              <select class="quote-status-select" data-quote-id="${escapeHtml(quote.id)}">
                ${['received', 'reviewing', 'quoted', 'closed', 'cancelled']
                  .map(
                    (status) =>
                      `<option value="${status}" ${status === quote.status ? 'selected' : ''}>${status}</option>`
                  )
                  .join('')}
              </select>
            </label>
          </div>
        </article>
      `
    )
    .join('');

  quoteList.querySelectorAll('.quote-status-select').forEach((select) => {
    select.addEventListener('change', async () => {
      select.disabled = true;
      try {
        const response = await authenticatedFetch(`/admin/quotes/${select.dataset.quoteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: select.value })
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error?.message ?? 'Unable to update quote status.');
        quotes = quotes.map((quote) => (quote.id === payload.data.id ? payload.data : quote));
        renderQuotes();
        showStatus('Quote status updated.');
      } catch (error) {
        showStatus(error instanceof Error ? error.message : 'Unable to update quote status.', true);
      } finally {
        select.disabled = false;
      }
    });
  });
}

function formatUsd(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function orderOptions(order) {
  const statuses = ['awaiting_payment', 'preparing', 'dispatched', 'delivered', 'cancelled'];
  return statuses
    .filter(
      (status) =>
        order.paymentStatus === 'paid' || status === order.status || status === 'cancelled'
    )
    .map(
      (status) =>
        `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`
    )
    .join('');
}

function renderOrders() {
  orderCount.textContent = `${orders.length} total`;
  if (orders.length === 0) {
    orderList.innerHTML = '<p class="admin-empty-state">No orders have been submitted yet.</p>';
    return;
  }
  orderList.innerHTML = orders
    .map(
      (order) => `
        <article class="admin-order-card">
          <h3>Order ${escapeHtml(order.id)}</h3>
          <p class="admin-order-summary"><strong>${escapeHtml(order.customerName || 'Customer')}</strong> · ${escapeHtml(order.customerEmail || 'Account unavailable')}</p>
          <p class="admin-order-summary">${formatUsd(order.totalCostCents)} USD · Submitted ${new Date(order.createdAt).toLocaleDateString()}</p>
          <ul class="admin-order-items">${order.items.map((item) => `<li>${escapeHtml(item.productName)} × ${item.quantity}</li>`).join('')}</ul>
          <div class="admin-order-footer">
            <div class="admin-product-tags">
              <span class="admin-product-tag">${escapeHtml(order.status)}</span>
              <span class="admin-product-tag payment-tag">${escapeHtml(order.paymentStatus)}</span>
            </div>
            <label>Fulfilment status
              <select class="quote-status-select" data-order-id="${escapeHtml(order.id)}">
                ${orderOptions(order)}
              </select>
            </label>
          </div>
        </article>
      `
    )
    .join('');

  orderList.querySelectorAll('.quote-status-select').forEach((select) => {
    select.addEventListener('change', async () => {
      select.disabled = true;
      try {
        const response = await authenticatedFetch(`/admin/orders/${select.dataset.orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: select.value })
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error?.message ?? 'Unable to update order status.');
        await loadOrders();
        showStatus('Order status updated.');
      } catch (error) {
        showStatus(error instanceof Error ? error.message : 'Unable to update order status.', true);
      } finally {
        select.disabled = false;
      }
    });
  });
}

async function loadProducts() {
  const response = await authenticatedFetch('/admin/products');
  if (response.status === 401) {
    clearSession();
    window.location.href = 'auth.html?returnTo=admin.html';
    return;
  }
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to load the catalogue.');
  products = payload.data;
  renderProducts();
}

async function loadQuotes() {
  const response = await authenticatedFetch('/admin/quotes');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to load quote requests.');
  quotes = payload.data;
  renderQuotes();
}

async function loadOrders() {
  const response = await authenticatedFetch('/admin/orders');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to load orders.');
  orders = payload.data;
  renderOrders();
}

if (!session || session.user.role !== 'admin') {
  window.location.href = 'auth.html?returnTo=admin.html';
} else {
  try {
    await Promise.all([loadProducts(), loadQuotes(), loadOrders()]);
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'Unable to load the catalogue.', true);
  }
}

cancelEdit.addEventListener('click', resetForm);
document.querySelector('.js-admin-sign-out').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const saveButton = form.querySelector('.js-save-product');
  saveButton.disabled = true;
  showStatus('Saving product…');

  try {
    let specifications;
    try {
      specifications = JSON.parse(form.elements.specifications.value);
    } catch {
      throw new Error('Specifications must be valid JSON, for example {"capacity":"10 t"}.');
    }
    const product = {
      externalId: form.elements.externalId.value.trim(),
      sku: form.elements.sku.value,
      name: form.elements.name.value,
      category: form.elements.category.value,
      image: form.elements.image.value,
      description: form.elements.description.value,
      purchaseMode: form.elements.purchaseMode.value,
      priceCents:
        form.elements.priceCents.value === '' ? null : Number(form.elements.priceCents.value),
      condition: form.elements.condition.value,
      minimumOrderQuantity: Number(form.elements.minimumOrderQuantity.value),
      stockStatus: form.elements.stockStatus.value,
      keywords: form.elements.keywords.value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      specifications,
      isActive: form.elements.isActive.checked
    };
    const path = editingExternalId ? `/admin/products/${editingExternalId}` : '/admin/products';
    const response = await authenticatedFetch(path, {
      method: editingExternalId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to save the product.');
    showStatus(editingExternalId ? 'Product updated.' : 'Product created.');
    resetForm();
    await loadProducts();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'Unable to save the product.', true);
  } finally {
    saveButton.disabled = false;
  }
});
