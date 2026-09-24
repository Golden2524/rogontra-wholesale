import { cart } from '../data/cart-class.js';
import { getProduct, loadProductsFetch, products } from '../data/products.js';
import setUpSearch from './utils/search.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatLabel(value) {
  return String(value)
    .replaceAll(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .trim();
}

function renderProduct(product) {
  const details = document.querySelector('.js-product-details');
  const status = document.querySelector('.js-product-status');
  document.title = `${product.name} | Rogontra Wholesale`;
  status.textContent = '';
  const specifications = Object.entries(product.specifications)
    .map(
      ([name, value]) => `<dt>${escapeHtml(formatLabel(name))}</dt><dd>${escapeHtml(value)}</dd>`
    )
    .join('');
  const checkoutAction = product.purchaseMode === 'checkout';

  details.innerHTML = `
    <p class="product-breadcrumb"><a href="index.html">Catalogue</a> / ${escapeHtml(product.category)}</p>
    <div class="product-details-layout">
      <div class="product-media"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" /></div>
      <div class="product-summary">
        <p class="product-category">${escapeHtml(product.category)} · ${escapeHtml(product.condition)}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="product-sku">SKU: ${escapeHtml(product.sku)}</p>
        <p class="product-price">${product.getPrice()}</p>
        <dl class="product-commercial-details"><div><dt>Minimum order</dt><dd>${product.minimumOrderQuantity} unit${product.minimumOrderQuantity === 1 ? '' : 's'}</dd></div><div><dt>Availability</dt><dd>${escapeHtml(product.stockStatus.replaceAll('_', ' '))}</dd></div></dl>
        ${checkoutAction ? `<div class="product-action"><label>Quantity <select class="js-product-quantity" aria-label="Quantity for ${escapeHtml(product.name)}">${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}</select></label><button class="button-primary js-add-product" type="button">Add to cart</button><p class="js-added-product action-status" role="status"></p></div>` : `<div class="product-action"><p class="quote-required-message">Sales-assisted quote required for this item.</p><button class="button-secondary quote-button js-request-quote" type="button" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}">Request a quote</button></div>`}
      </div>
    </div>
    <section class="product-specifications" aria-labelledby="specifications-title"><h2 id="specifications-title">Specifications</h2>${specifications ? `<dl>${specifications}</dl>` : '<p>Contact sales for the complete specification sheet.</p>'}</section>`;

  const addButton = document.querySelector('.js-add-product');
  if (addButton) {
    addButton.addEventListener('click', () => {
      const quantity = Number(document.querySelector('.js-product-quantity').value);
      cart.addToCart(product.id, quantity);
      document.querySelector('.js-cart-quantity').textContent = cart.calculateCartQuantity();
      document.querySelector('.js-added-product').textContent = 'Added to cart.';
    });
  }
}

async function loadPage() {
  const status = document.querySelector('.js-product-status');
  try {
    await loadProductsFetch();
    cart.removeUnavailableItems(products.map((product) => product.id));
    document.querySelector('.js-cart-quantity').textContent = cart.calculateCartQuantity();
    const productId = new URL(window.location.href).searchParams.get('productId');
    const product = getProduct(productId);
    if (!product) throw new Error('This product is unavailable or no longer listed.');
    renderProduct(product);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Unable to load product details.';
  }
}

setUpSearch();
loadPage();
