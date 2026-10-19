import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('product page presents wholesale details and a quote path', async () => {
  const [html, script] = await Promise.all([
    readFile('product.html', 'utf8'),
    readFile('scripts/product.js', 'utf8')
  ]);
  assert.match(html, /Specifications/);
  assert.match(script, /js-request-quote/);
  assert.match(script, /product\.description/);
  assert.match(html, /Skip to product details/);
  assert.match(html, /name="description"/);
  assert.match(script, /function setProductMetadata/);
  assert.match(script, /description\.slice\(0, 160\)/);
  assert.match(
    html,
    /<dialog class="quote-dialog js-quote-dialog" aria-labelledby="quote-title" aria-modal="true">/
  );
});

test('catalogue links products to their detail page and preserves product detail returns', async () => {
  const [catalogue, auth, product] = await Promise.all([
    readFile('scripts/index.js', 'utf8'),
    readFile('scripts/auth-page.js', 'utf8'),
    readFile('scripts/product.js', 'utf8')
  ]);
  assert.match(catalogue, /product\.html\?productId=/);
  assert.match(auth, /product\\\.html/);
  assert.match(product, /product\.specifications/);
  assert.match(product, /product\.minimumOrderQuantity \+ index/);
});
