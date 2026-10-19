import assert from 'node:assert/strict';
import test from 'node:test';

import { createQuoteRequest } from '../backend/src/quotes.js';

const quoteProduct = {
  id: 'rgw-excavator-001',
  name: 'Illustrative tracked excavator',
  purchaseMode: 'quote',
  minimumOrderQuantity: 1
};

const validRequest = {
  productId: quoteProduct.id,
  quantity: 1,
  companyName: 'Example Procurement Ltd',
  contactName: 'Ada Buyer',
  email: 'ada@example.com',
  destinationCountry: 'Nigeria',
  notes: 'Please include an estimated freight lead time.'
};

test('quote requests trim durable customer details and preserve only allowed product types', async () => {
  const quote = await createQuoteRequest(
    { ...validRequest, companyName: '  Example Procurement Ltd  ', notes: '  Need an estimate.  ' },
    async () => quoteProduct
  );

  assert.equal(quote.companyName, 'Example Procurement Ltd');
  assert.equal(quote.notes, 'Need an estimate.');
  assert.equal(quote.productName, quoteProduct.name);
  assert.equal(quote.status, 'received');
  assert.ok(Date.parse(quote.createdAt));

  await assert.rejects(
    () =>
      createQuoteRequest(validRequest, async () => ({ ...quoteProduct, purchaseMode: 'checkout' })),
    (error) => error.code === 'QUOTE_PRODUCT_NOT_FOUND'
  );
});

test('quote requests reject invalid quantity and business contact details', async () => {
  await assert.rejects(
    () => createQuoteRequest({ ...validRequest, quantity: 0 }, async () => quoteProduct),
    (error) => error.code === 'INVALID_QUOTE_REQUEST' && /whole number/.test(error.message)
  );
  await assert.rejects(
    () => createQuoteRequest({ ...validRequest, email: 'not-an-email' }, async () => quoteProduct),
    (error) => error.code === 'INVALID_QUOTE_REQUEST' && /business email/.test(error.message)
  );
  await assert.rejects(
    () => createQuoteRequest({ ...validRequest, companyName: '' }, async () => quoteProduct),
    (error) => error.code === 'INVALID_QUOTE_REQUEST' && /Company name/.test(error.message)
  );
});
