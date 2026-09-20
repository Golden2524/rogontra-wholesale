import assert from 'node:assert/strict';
import test from 'node:test';

import formatCurrency from '../scripts/utils/money.js';

test('formats integer cents as USD-compatible decimal values', () => {
  assert.equal(formatCurrency(0), '0.00');
  assert.equal(formatCurrency(1099), '10.99');
  assert.equal(formatCurrency(10747), '107.47');
});

test('rounds fractional-cent arithmetic consistently', () => {
  assert.equal(formatCurrency(1999.5), '20.00');
});
