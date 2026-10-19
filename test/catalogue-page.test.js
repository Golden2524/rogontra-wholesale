import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('catalogue exposes accessible category filters that work with search', async () => {
  const [html, script, search] = await Promise.all([
    readFile('index.html', 'utf8'),
    readFile('scripts/index.js', 'utf8'),
    readFile('scripts/utils/search.js', 'utf8')
  ]);
  assert.match(html, /Filter catalogue by category/);
  assert.match(script, /category-filters/);
  assert.match(script, /category-filter/);
  assert.match(script, /featuredProducts\.filter/);
  assert.match(script, /product\.minimumOrderQuantity \+ index/);
  assert.match(script, /The catalogue is temporarily unavailable/);
  assert.match(search, /searchParams\.get\('category'\)/);
});
