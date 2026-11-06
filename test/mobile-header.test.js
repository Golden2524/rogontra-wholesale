import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mobile navigation moves catalogue search onto a full-width second row', async () => {
  const [headerCss, indexCss, productCss] = await Promise.all([
    readFile('styles/shared/index-header.css', 'utf8'),
    readFile('styles/pages/index.css', 'utf8'),
    readFile('styles/pages/product.css', 'utf8')
  ]);

  assert.match(headerCss, /@media \(max-width: 575px\)/);
  assert.match(headerCss, /--rogontra-header-height: 112px/);
  assert.match(headerCss, /\.rogontra-header-middle-section \{\s*order: 3;\s*flex-basis: 100%/);
  assert.match(indexCss, /margin-top: var\(--rogontra-header-height\)/);
  assert.match(productCss, /margin-top: var\(--rogontra-header-height\)/);
});
