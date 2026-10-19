import assert from 'node:assert/strict';
import test from 'node:test';

import { runDeploymentSmokeCheck } from '../backend/src/deployment-smoke.js';

function response(body, { headers = {}, ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: new Headers(headers),
    json: async () => body
  };
}

test('deployment smoke check validates public HTTPS storefront and API responses', async () => {
  const requestedUrls = [];
  const result = await runDeploymentSmokeCheck({
    apiBaseUrl: 'https://api.rogontra.example/api/v1',
    storefrontUrl: 'https://www.rogontra.example',
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      if (String(url).endsWith('/health')) {
        return response(
          { data: { status: 'ok' } },
          { headers: { 'x-content-type-options': 'nosniff' } }
        );
      }
      if (String(url).endsWith('/ready')) return response({ data: { status: 'ready' } });
      if (String(url).endsWith('/products')) return response({ data: [{ id: 'product-1' }] });
      if (String(url).endsWith('/categories')) return response({ data: ['Industrial Parts'] });
      return response({});
    }
  });

  assert.deepEqual(result, {
    api: 'https://api.rogontra.example',
    storefront: 'https://www.rogontra.example',
    catalogueItems: 1,
    categories: 1
  });
  assert.ok(requestedUrls.includes('https://api.rogontra.example/api/v1/health'));
  assert.ok(requestedUrls.includes('https://www.rogontra.example/'));
});

test('deployment smoke check rejects incomplete URLs and unhealthy deployment responses', async () => {
  await assert.rejects(
    () =>
      runDeploymentSmokeCheck({
        apiBaseUrl: 'http://api.rogontra.example/api/v1',
        storefrontUrl: 'https://www.rogontra.example'
      }),
    /ROGONTRA_API_BASE_URL must be an HTTPS URL/
  );

  await assert.rejects(
    () =>
      runDeploymentSmokeCheck({
        apiBaseUrl: 'https://api.rogontra.example/api/v1',
        storefrontUrl: 'https://www.rogontra.example',
        fetchImpl: async () => response({ data: { status: 'ok' } })
      }),
    /API readiness response did not report ready/
  );
});
