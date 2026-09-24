import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

for (const page of ['privacy.html', 'terms.html', 'shipping.html', 'refunds.html']) {
  test(`${page} is clearly marked as a pre-launch policy draft`, async () => {
    const html = await readFile(page, 'utf8');
    assert.match(html, /Pre-launch document/);
    assert.match(html, /Draft only/);
    assert.match(html, /skip-link/);
  });
}
