import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('release readiness keeps portfolio deployment separate from commercial launch', async () => {
  const [readiness, screenshots] = await Promise.all([
    readFile('docs/release-readiness.md', 'utf8'),
    readFile('docs/screenshots/README.md', 'utf8')
  ]);

  assert.match(readiness, /## Portfolio deployment checklist/);
  assert.match(readiness, /## Commercial launch checklist/);
  assert.match(
    readiness,
    /Rogontra is ready to be posted on LinkedIn only when every portfolio checklist item is complete/
  );
  assert.match(readiness, /server-side FX quote provider/);
  assert.match(screenshots, /01-catalogue-desktop\.png/);
  assert.match(screenshots, /demo@example\.invalid/);
  assert.match(screenshots, /Do not capture payment-provider screens/);
});
