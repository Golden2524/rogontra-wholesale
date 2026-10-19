function requireHttpsUrl(value, label) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error();
    return url;
  } catch {
    throw new Error(`${label} must be an HTTPS URL.`);
  }
}

async function getJson(fetchImpl, url, label) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}.`);
  return { body: await response.json(), response };
}

export async function runDeploymentSmokeCheck({ apiBaseUrl, fetchImpl = fetch, storefrontUrl }) {
  const apiUrl = requireHttpsUrl(apiBaseUrl, 'ROGONTRA_API_BASE_URL');
  const storefront = requireHttpsUrl(storefrontUrl, 'ROGONTRA_STOREFRONT_URL');
  const requiredApiPath = '/api/v1';
  if (!apiUrl.pathname.endsWith(requiredApiPath)) {
    throw new Error(`ROGONTRA_API_BASE_URL must end with ${requiredApiPath}.`);
  }

  const [health, ready, products, categories, storefrontResponse] = await Promise.all([
    getJson(fetchImpl, new URL('health', `${apiUrl.href}/`), 'API health check'),
    getJson(fetchImpl, new URL('ready', `${apiUrl.href}/`), 'API readiness check'),
    getJson(fetchImpl, new URL('products', `${apiUrl.href}/`), 'API product check'),
    getJson(fetchImpl, new URL('categories', `${apiUrl.href}/`), 'API category check'),
    fetchImpl(storefront)
  ]);

  if (health.body.data?.status !== 'ok') throw new Error('API health response did not report ok.');
  if (ready.body.data?.status !== 'ready')
    throw new Error('API readiness response did not report ready.');
  if (!Array.isArray(products.body.data) || products.body.data.length === 0) {
    throw new Error('API product response did not contain catalogue items.');
  }
  if (!Array.isArray(categories.body.data) || categories.body.data.length === 0) {
    throw new Error('API category response did not contain categories.');
  }
  if (!storefrontResponse.ok) {
    throw new Error(`Storefront check returned HTTP ${storefrontResponse.status}.`);
  }
  if (health.response.headers.get('x-content-type-options') !== 'nosniff') {
    throw new Error('API health response is missing the expected nosniff header.');
  }

  return {
    catalogueItems: products.body.data.length,
    categories: categories.body.data.length,
    api: apiUrl.origin,
    storefront: storefront.origin
  };
}
