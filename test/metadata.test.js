import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('homepage includes accessible sharing metadata and an owned social preview asset', async () => {
  const [homepage, socialCard] = await Promise.all([
    readFile('index.html', 'utf8'),
    readFile('images/rogontra-social-card.svg', 'utf8')
  ]);

  assert.match(homepage, /<html lang="en">/);
  assert.match(homepage, /<meta charset="utf-8"/);
  assert.match(homepage, /name="description"/);
  assert.match(homepage, /property="og:title"/);
  assert.match(homepage, /property="og:image" content="images\/rogontra-social-card\.svg"/);
  assert.match(homepage, /name="twitter:card" content="summary_large_image"/);
  assert.match(socialCard, /width="1200" height="630"/);
  assert.match(socialCard, /Rogontra Wholesale/);
});

test('private and pre-launch pages opt out of search indexing', async () => {
  const privatePages = [
    'admin.html',
    'auth.html',
    'checkout.html',
    'orders.html',
    'payment-return.html',
    'tracking.html',
    'privacy.html',
    'terms.html',
    'shipping.html',
    'refunds.html'
  ];
  const pages = await Promise.all(privatePages.map((page) => readFile(page, 'utf8')));

  pages.forEach((page) => {
    assert.match(page, /<html lang="en">/);
    assert.match(page, /<meta charset="utf-8"/);
    assert.match(page, /<meta name="robots" content="noindex, nofollow"/);
  });
});
