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
