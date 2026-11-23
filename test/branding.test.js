import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('public API health identity uses the Helen Wholesale brand', async () => {
  const source = await readFile('backend/src/app.js', 'utf8');
  assert.match(source, /service: 'helen-wholesale-api'/);
  assert.doesNotMatch(source, /service: 'rogontra-api'/);
});
