import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStorefrontAsset } from '../scripts/utils/assets.js';

test('resolves approved catalogue assets from the storefront origin', () => {
  assert.equal(
    resolveStorefrontAsset(
      'images/products/helen-excavator.svg',
      'https://rogontra-wholesale.vercel.app/index.html'
    ),
    'https://rogontra-wholesale.vercel.app/images/products/helen-excavator.svg'
  );
});

test('rejects non-storefront catalogue image paths', () => {
  assert.equal(
    resolveStorefrontAsset('https://untrusted.example/image.svg', 'https://rogontra.test'),
    ''
  );
  assert.equal(resolveStorefrontAsset('../private.svg', 'https://rogontra.test'), '');
});
