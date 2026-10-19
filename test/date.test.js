import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDeliveryDate, formatMonthDay, formatMonthDayYear } from '../scripts/utils/date.js';

test('formats catalogue and account dates without a third-party browser dependency', () => {
  const reference = new Date(2026, 0, 5, 12);

  assert.equal(formatMonthDay(reference), 'January 5');
  assert.equal(formatMonthDayYear(reference), 'January 5, 2026');
  assert.equal(formatDeliveryDate(3, reference), 'Thursday, January 8');
});

test('date formatting rejects invalid delivery calculations', () => {
  assert.throws(() => formatDeliveryDate(-1), /non-negative integer/);
  assert.throws(() => formatMonthDay('not-a-date'), /valid date/);
});
