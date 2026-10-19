import { loadProductsFetch, getProduct } from '../data/products.js';
import formatCurrency from './utils/money.js';
import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { cart } from '../data/cart-class.js';
import setUpSearch from './utils/search.js';
import { authenticatedFetch, getSession } from './auth-client.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadPage() {
  await loadProductsFetch();

  if (!getSession()) {
    window.location.href = 'auth.html?returnTo=orders.html';
    return;
  }

  const [ordersResponse, quotesResponse] = await Promise.all([
    authenticatedFetch('/account/orders'),
    authenticatedFetch('/account/quotes')
  ]);
  const [ordersPayload, quotesPayload] = await Promise.all([
    ordersResponse.json(),
    quotesResponse.json()
  ]);
  if (ordersResponse.status === 401 || quotesResponse.status === 401) {
    window.location.href = 'auth.html?returnTo=orders.html';
    return;
  }
  if (!ordersResponse.ok) {
    throw new Error(ordersPayload.error?.message ?? 'Unable to load your orders.');
  }
  if (!quotesResponse.ok) {
    throw new Error(quotesPayload.error?.message ?? 'Unable to load your quote requests.');
  }
  const orders = ordersPayload.data;
  const quotes = quotesPayload.data;

  let ordersHTML = '';

  if (orders.length === 0) {
    ordersHTML =
      '<p class="account-empty-state">No orders yet. Your submitted test orders will appear here.</p>';
  }

  orders.forEach((order) => {
    const orderTimeString = dayjs(order.orderTime).format('MMMM D');

    ordersHTML += `
      <div class="order-container">    
        <div class="order-header">
          <div class="order-header-left-section">
            <div class="order-date">
              <div class="order-header-label">Order Placed:</div>
              <div>${orderTimeString}</div>
            </div>
            <div class="order-total">
              <div class="order-header-label">Total:</div>
              <div>$${formatCurrency(order.totalCostCents)}</div>
            </div>
            ${
              order.deliveryAddress
                ? `<div class="order-destination"><div class="order-header-label">Deliver to:</div><div>${escapeHtml(order.deliveryAddress.city)}, ${escapeHtml(order.deliveryAddress.country)}</div></div>`
                : ''
            }
          </div>

          <div class="order-header-right-section">
            <div class="order-header-label">Order ID:</div>
            <div>${order.id}</div>
            <div class="order-payment-status">Payment: ${order.paymentStatus.replaceAll('_', ' ')}</div>
            ${order.paymentStatus === 'not_collected' && order.status !== 'cancelled' ? `<button class="pay-order-button js-pay-order" data-order-id="${order.id}">Continue to payment</button>` : ''}
          </div>
        </div>

        <div class="order-details-grid">
          ${productsListHTML(order)}
        </div>
      </div>
    `;
  });

  function productsListHTML(order) {
    let productsListHTML = '';

    order.products.forEach((productDetails) => {
      const product = getProduct(productDetails.productId);
      if (!product) return;

      productsListHTML += `
        <div class="product-image-container">
          <img src="${product.image}">
        </div>

        <div class="product-details">
          <div class="product-name">
            ${product.name}
          </div>
          <div class="product-delivery-date">${['preparing', 'dispatched', 'delivered'].includes(order.status) ? `Estimated arrival: ${dayjs(productDetails.estimatedDeliveryTime).format('MMMM D')}` : 'Fulfilment begins after verified payment.'}</div>
          <div class="product-quantity">
            Quantity: ${productDetails.quantity}
          </div>
          <button class="buy-again-button button-primary
          js-buy-again-button"
          data-product-id="${product.id}"
          data-quantity="${productDetails.quantity}">
            <img class="buy-again-icon" src="images/icons/buy-again.png">
            <span class="buy-again-message">Buy it again</span>
          </button>
        </div>

        <div class="product-actions">
          ${['preparing', 'dispatched', 'delivered'].includes(order.status) ? `<a href="tracking.html?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(product.id)}"><span class="track-package-button button-secondary">View fulfilment</span></a>` : '<span class="fulfilment-pending">Tracking is available after fulfilment starts.</span>'}
        </div>
      `;
    });

    return productsListHTML;
  }

  document.querySelector('.js-order-grid').innerHTML = ordersHTML;
  document.querySelector('.js-quote-history-grid').innerHTML = quotesHistoryHTML(quotes);

  document.querySelectorAll('.js-pay-order').forEach((button) => {
    button.addEventListener('click', async () => {
      const message = document.querySelector('.js-account-message');
      button.disabled = true;
      message.textContent = 'Starting secure payment…';
      try {
        const response = await authenticatedFetch(
          `/account/orders/${button.dataset.orderId}/payment`,
          {
            method: 'POST'
          }
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to start payment.');
        window.location.href = payload.data.authorizationUrl;
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'Unable to start payment.';
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll('.js-buy-again-button').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      const quantity = Number(button.dataset.quantity);

      cart.addToCart(productId, quantity);

      button.innerHTML = 'Added';

      setTimeout(() => {
        button.innerHTML = `
            <img class="buy-again-icon" src="images/icons/buy-again.png">
            <span class="buy-again-message">Buy it again</span>
          `;
      }, 1000);

      updateOrderQuantity();
    });
  });

  function updateOrderQuantity() {
    const cartQuantity = cart.calculateCartQuantity();

    document.querySelector('.js-quantity-count').innerHTML = cartQuantity;
  }

  function quotesHistoryHTML(quoteRequests) {
    if (quoteRequests.length === 0) {
      return '<p class="account-empty-state">No quote requests yet. Request a quote for high-value or configurable products from the catalogue.</p>';
    }

    return quoteRequests
      .map(
        (quote) => `
          <article class="quote-history-card">
            <div>
              <p class="quote-history-meta">Submitted ${dayjs(quote.createdAt).format('MMMM D, YYYY')}</p>
              <h3>${quote.productName}</h3>
              <p>Quantity: ${quote.quantity} · Destination: ${quote.destinationCountry}</p>
            </div>
            <span class="quote-status-badge">${quote.status}</span>
          </article>
        `
      )
      .join('');
  }

  setUpSearch();

  return updateOrderQuantity();
}

loadPage();
