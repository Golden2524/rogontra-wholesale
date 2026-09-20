import products from '../rogontra-catalogue.json' with { type: 'json' };

function matchesSearch(product, query) {
  const normalizedQuery = query.toLowerCase();
  const searchableText = [product.name, product.id, ...product.keywords].join(' ').toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function findProductById(productId) {
  return products.find((product) => product.id === productId);
}

export function listProducts({ query, category } = {}) {
  return products.filter((product) => {
    const matchesQuery = !query || matchesSearch(product, query);
    const matchesCategory = !category || product.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function listCategories() {
  return [...new Set(products.map((product) => product.category))].sort();
}
