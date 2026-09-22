import { getOrder } from '../data/order.js';
import { loadProductsFetch, getProduct } from '../data/products.js';
import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import setUpSearch from './utils/search.js';
import { authenticatedFetch, getSession } from './auth-client.js';

async function loadPage() {
  await loadProductsFetch();

  const url = new URL(window.location.href);
  const orderId = url.searchParams.get('orderId');
  const productId = url.searchParams.get('productId');

  let order = getOrder(orderId);
  if (getSession()) {
    const response = await authenticatedFetch(`/account/orders/${orderId}`);
    const payload = await response.json();
    if (response.status === 401) {
      window.location.href = 'auth.html?returnTo=orders.html';
      return;
    }
    if (!response.ok) throw new Error(payload.error?.message ?? 'Unable to load this order.');
    order = payload.data;
  }
  const product = getProduct(productId);

  if (!order || !product) {
    window.location.href = 'orders.html';
    return;
  }

  let productDetails;

  order.products.forEach((details) => {
    if (details.productId === product.id) {
      productDetails = details;
    }
  });

  if (!productDetails) {
    window.location.href = 'orders.html';
    return;
  }

  const today = dayjs();
  const orderTime = dayjs(order.orderTime);
  const deliveryTime = dayjs(productDetails.estimatedDeliveryTime);
  const percentProgress = ((today - orderTime) / (deliveryTime - orderTime)) * 100;

  const deliveredMessage = today < deliveryTime ? 'Arriving on' : 'Delivered on';

  //add || calculate truck positioning
  const truckPosition = Math.min(percentProgress, 95);

  const trackingHTML = `
    <a class="back-to-orders-link link-primary" href="orders.html">
      View all orders
    </a>

    <div class="delivery-date">
      ${deliveredMessage} ${deliveryTime.format('dddd, MMMM D')}
    </div>

    <div class="product-info">
      ${product.name}
    </div>

    <div class="product-info">
      Quantity: ${productDetails.quantity}
    </div>

    <img class="product-image" src="${product.image}">

    <div class="progress-labels-container">
      <div class="progress-label ${percentProgress < 50 ? 'current-status' : ''}">
        Preparing
      </div>
      <div class="progress-label ${percentProgress >= 50 && percentProgress < 100 ? 'current-status' : ''}">
        Shipped
      </div>
      <div class="progress-label ${percentProgress >= 100 ? 'current-status' : ''}">
        Delivered
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar js-progress-bar" style="width: ${percentProgress}%;"></div>
      <div class="truck-icon js-truck" style="left: ${(percentProgress, truckPosition)}%;">🚚</div>
    </div>

    <div class="delivery-countdown js-delivery-countdown"></div>
  `;

  document.querySelector('.js-order-tracking').innerHTML = trackingHTML;

  //recalculating tracking progress every few secs while page is open
  /*
  function updateTrackingProgress() {
    percentProgress = Math.min(Math.max(percentProgress, 0), 100);

    document.querySelector('.js-progress-bar')
      .style.width = percentProgress + '%';

    document.querySelector('.js-truck')
      .style.left = percentProgress + '%';
  }
  */

  //change emoji to suit current position
  function updateDeliveryEmoji() {
    const deliveryTruck = document.querySelector('.js-truck');

    if (percentProgress >= 100) {
      deliveryTruck.innerHTML = '📦';
      deliveryTruck.style.animation = 'none';
    } else if (percentProgress < 50) {
      deliveryTruck.innerHTML = '📦';
    }
  }

  //Add time countdown below the progress bar
  function updateCountdown() {
    const now = new Date();
    const timeRemaining = deliveryTime - now;

    if (timeRemaining <= 0) {
      document.querySelector('.js-delivery-countdown').innerText = 'Package delivered 🎉';
      return;
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    document.querySelector('.js-delivery-countdown').innerText =
      `Arriving in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  //update countdown after every 1sec
  setInterval(updateCountdown, 1000);

  //update tracking progress after every 3secs
  /*
  const progressInterval = setInterval(updateTrackingProgress, 3000);
  if (percentProgress >= 100) {
    clearInterval(progressInterval);
  }
  */
  setUpSearch();

  return (updateCountdown(), updateDeliveryEmoji()); /*updateTrackingProgress()*/
}

loadPage();
