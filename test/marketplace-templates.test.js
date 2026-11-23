import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('client marketplace templates define the data required before channel synchronization', async () => {
  const [catalogue, fulfilment, readme] = await Promise.all([
    readFile('docs/templates/helen-wholesale-catalogue-template.csv', 'utf8'),
    readFile('docs/templates/helen-wholesale-fulfilment-template.csv', 'utf8'),
    readFile('docs/templates/README.md', 'utf8')
  ]);

  assert.match(catalogue, /helen_sku,product_name,category/);
  assert.match(catalogue, /available_quantity/);
  assert.match(catalogue, /target_jumia_market/);
  assert.match(fulfilment, /dispatch_country,dispatch_city/);
  assert.match(readme, /Do not include customer data, bank details, passwords, API keys, tokens/);
});
