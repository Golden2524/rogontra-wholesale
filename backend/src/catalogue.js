import products from '../products.json' with { type: 'json' };

function matchesSearch(product, query) {
  const normalizedQuery = query.toLowerCase();
  const searchableText = [product.name, product.id, ...product.keywords].join(' ').toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function findProductById(productId) {
  return products.find((product) => product.id === productId);
}

export function listProducts({ query } = {}) {
  if (!query) {
    return products;
  }

  return products.filter((product) => matchesSearch(product, query));
}
