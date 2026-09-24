import { products, loadProductsFetch } from '../data/products.js';
import { cart } from '../data/cart-class.js';
import setUpSearch from './utils/search.js';

//loadProducts(renderProductsGrid);
loadProductsFetch().then(() => {
  cart.removeUnavailableItems(products.map((product) => product.id));
  renderProductsGrid();
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderProductsGrid() {
  const url = new URL(window.location.href);
  const search = url.searchParams.get('search');
  const category = url.searchParams.get('category');

  //keep search text inside search bar
  const searchInput = document.querySelector('.js-search-bar');
  if (search && searchInput) {
    searchInput.value = search;
  }

  const categories = [...new Set(products.map((product) => product.category))].sort();
  const categoryFilters = document.querySelector('.js-category-filters');
  categoryFilters.innerHTML = [undefined, ...categories]
    .map((categoryName) => {
      const label = categoryName ?? 'All categories';
      const filterUrl = new URL('index.html', window.location.href);
      if (categoryName) filterUrl.searchParams.set('category', categoryName);
      if (search) filterUrl.searchParams.set('search', search);
      const isCurrent = category === categoryName || (!category && !categoryName);
      return `<a class="category-filter${isCurrent ? ' is-active' : ''}" href="${escapeHtml(filterUrl.toString())}"${isCurrent ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
    })
    .join('');

  let featuredProducts = products.filter((product) => !category || product.category === category);

  if (search) {
    featuredProducts = products.filter((product) => {
      let matchingKeyword = false;

      product.keywords.forEach((keyword) => {
        if (keyword.toLowerCase().includes(search.toLowerCase())) {
          matchingKeyword = true;
        }
      });

      return matchingKeyword || product.name.toLowerCase().includes(search.toLowerCase());
    });
  }

  const messageElement = document.querySelector('.js-empty-message');
  if (featuredProducts.length === 0) {
    messageElement.textContent = search
      ? 'No products matched this search and category.'
      : 'No products are available in this category.';
  } else {
    messageElement.textContent = '';
  }

  let productsHTML = '';

  featuredProducts.forEach((product) => {
    productsHTML += `
      <div class="product-container">
        <div class="product-image-container">
          <a href="product.html?productId=${encodeURIComponent(product.id)}" class="product-detail-link">
            <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          </a>
        </div>

        <div class="product-name limit-text-to-2-lines">
          <a href="product.html?productId=${encodeURIComponent(product.id)}" class="product-detail-link">${escapeHtml(product.name)}</a>
        </div>

        <div class="product-category">
          ${escapeHtml(product.category)} · ${escapeHtml(product.condition)}
        </div>

        <div class="product-price">
          ${product.getPrice()}
        </div>

        <div class="product-wholesale-details">
          <span>SKU: ${escapeHtml(product.sku)}</span>
          <span>MOQ: ${product.minimumOrderQuantity}</span>
          <span>${product.stockStatus.replaceAll('_', ' ')}</span>
        </div>

        ${
          product.purchaseMode === 'checkout'
            ? `
        <div class="product-quantity-container">
          <label>Quantity
          <select class="js-product-quantity-${product.id}" aria-label="Quantity for ${escapeHtml(product.name)}">
            <option selected value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
          <option value="10">10</option>
          </select>
          </label>
        </div>
        `
            : `
        <div class="quote-required-message">
          Sales-assisted quote required
        </div>
        `
        }

        ${product.extraInfoHTML()}

        <div class="product-spacer"></div>

        ${
          product.purchaseMode === 'checkout'
            ? `
        <div class="added-to-cart js-added-to-cart-${product.id}">
          <img src="images/icons/checkmark.png" alt="">
          Added
        </div>

        <button class="add-to-cart-button button-primary
        js-add-to-cart-button"
        data-product-id="${product.id}">
          Add to Cart
        </button>
        `
            : `<button class="quote-button button-secondary js-request-quote" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}">Request a quote</button>`
        }
      </div>
    `;
  });

  document.querySelector('.js-products-grid').innerHTML = productsHTML;
  document.querySelector('.js-products-grid').setAttribute('aria-busy', 'false');

  function updateCartQuantity() {
    const cartQuantity = cart.calculateCartQuantity();

    document.querySelector('.js-cart-quantity').innerHTML = cartQuantity;
  }

  document.querySelectorAll('.js-add-to-cart-button').forEach((button) => {
    let addedMessageTimeoutId;

    button.addEventListener('click', () => {
      const productId = button.dataset.productId;

      const quantitySelector = document.querySelector(`.js-product-quantity-${productId}`);
      const quantity = Number(quantitySelector.value);

      const addedMessage = document.querySelector(`.js-added-to-cart-${productId}`);
      addedMessage.classList.add('added-to-cart-visible');

      if (addedMessageTimeoutId) {
        clearTimeout(addedMessageTimeoutId);
      }
      const timeoutId = setTimeout(() => {
        addedMessage.classList.remove('added-to-cart-visible');
      }, 2000);
      addedMessageTimeoutId = timeoutId;

      cart.addToCart(productId, quantity);
      updateCartQuantity();
    });
  });

  setUpSearch();

  return updateCartQuantity();
}
