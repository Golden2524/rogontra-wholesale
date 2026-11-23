import assert from 'node:assert/strict';
import test from 'node:test';

import { validateMarketplaceData } from '../backend/src/marketplace-preflight.js';

const catalogueHeader =
  'helen_sku,product_name,category,brand,gtin_or_barcode,description,currency,price,available_quantity,weight_kg,length_cm,width_cm,height_cm,primary_image_url,target_jumia_market,listing_approval';
const fulfilmentHeader =
  'target_marketplace,dispatch_country,dispatch_city,carrier_or_delivery_partner,handling_time_business_days,returns_process_owner';

test('marketplace preflight accepts a complete approved product and matching fulfilment row', () => {
  const result = validateMarketplaceData(
    `${catalogueHeader}\nHW-001,Industrial glove,Safety,Helen,123,Protective work glove,USD,12.50,20,0.2,20,10,5,https://example.com/glove.jpg,Jumia Nigeria,Approved`,
    `${fulfilmentHeader}\nJumia Nigeria,Nigeria,Lagos,Client carrier,2,Helen operations`
  );
  assert.deepEqual(result, { errors: [], approvedProducts: 1 });
});

test('marketplace preflight rejects incomplete approved listings and unmatched fulfilment', () => {
  const incompleteProduct = [
    'HW-001',
    'Industrial glove',
    'Safety',
    '',
    '',
    '',
    'EUR',
    '0',
    '-1',
    '',
    '',
    '',
    '',
    '',
    'Jumia Nigeria',
    'Approved'
  ].join(',');
  const result = validateMarketplaceData(
    `${catalogueHeader}\n${incompleteProduct}`,
    `${fulfilmentHeader}\nJumia Kenya,,,,,`
  );
  assert.ok(result.errors.some((error) => error.includes('currency must be USD')));
  assert.ok(result.errors.some((error) => error.includes('available_quantity')));
  assert.ok(result.errors.some((error) => error.includes('matching fulfilment row')));
});
