import { getProduct, loadProductsFetch } from '../data/products.js';
import { authenticatedFetch, getSession } from './auth-client.js';
import setUpSearch from './utils/search.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function progressForOrder(order) {
  if (order.status === 'cancelled') return { label: 'Cancelled', progress: 0 };
  if (order.status === 'delivered') return { label: 'Delivered', progress: 100 };
  if (order.status === 'dispatched') return { label: 'Dispatched', progress: 66 };
  if (order.status === 'preparing') return { label: 'Preparing for dispatch', progress: 33 };
  if (order.paymentStatus === 'paid') return { label: 'Payment verified', progress: 15 };
  return { label: 'Awaiting payment', progress: 0 };
}

function renderTracking(order, item) {
  const product = getProduct(item.productId);
  const state = progressForOrder(order);
  const destination = order.deliveryAddress
    ? `${order.deliveryAddress.city}, ${order.deliveryAddress.country}`
    : 'Destination pending';
  const shipmentStarted = ['preparing', 'dispatched', 'delivered'].includes(order.status);

  document.querySelector('.js-order-tracking').innerHTML = `
    <a class="back-to-orders-link link-primary" href="orders.html">View all orders</a>
    <p class="tracking-eyebrow">Order ${escapeHtml(order.id)}</p>
    <h1>${escapeHtml(item.productName)}</h1>
    <p class="tracking-product-meta">Quantity: ${item.quantity} · Delivering to: ${escapeHtml(destination)}</p>
    ${product?.image ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(item.productName)}" />` : ''}
    <section class="tracking-status" aria-labelledby="tracking-status-title">
      <h2 id="tracking-status-title">${escapeHtml(state.label)}</h2>
      <p>${shipmentStarted ? 'This status is updated by Rogontra operations. Delivery dates remain estimates until dispatch.' : 'Shipping progress becomes available after payment verification and fulfilment preparation.'}</p>
      <div class="progress-labels-container" aria-hidden="true"><span class="${state.progress >= 33 ? 'current-status' : ''}">Preparing</span><span class="${state.progress >= 66 ? 'current-status' : ''}">Dispatched</span><span class="${state.progress === 100 ? 'current-status' : ''}">Delivered</span></div>
      <div class="progress-bar-container" role="progressbar" aria-label="Order fulfilment progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.progress}"><div class="progress-bar" style="width: ${state.progress}%"></div></div>
    </section>`;
}

async function loadPage() {
  const container = document.querySelector('.js-order-tracking');
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get('orderId');
  const productId = url.searchParams.get('productId');
  const returnTo = encodeURIComponent(
    `tracking.html?orderId=${orderId ?? ''}&productId=${productId ?? ''}`
  );

  if (!getSession()) {
    window.location.href = `auth.html?returnTo=${returnTo}`;
    return;
  }
  if (!orderId || !productId) {
    window.location.href = 'orders.html';
    return;
  }

  try {
    await loadProductsFetch();
    const response = await authenticatedFetch(`/account/orders/${encodeURIComponent(orderId)}`);
    const payload = await response.json();
    if (response.status === 401) {
      window.location.href = `auth.html?returnTo=${returnTo}`;
      return;
    }
    if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to load this order.');
    const item = payload.data.products.find((product) => product.productId === productId);
    if (!item) throw new Error('This item is not part of the requested order.');
    renderTracking(payload.data, item);
  } catch (error) {
    container.innerHTML = `<a class="back-to-orders-link link-primary" href="orders.html">View all orders</a><p class="tracking-error" role="alert">${escapeHtml(error instanceof Error ? error.message : 'Unable to load tracking details.')}</p>`;
  }
}

setUpSearch();
loadPage();
