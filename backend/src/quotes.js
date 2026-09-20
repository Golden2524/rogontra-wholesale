import { randomUUID } from 'node:crypto';

import { findProductById } from './catalogue.js';

function clientError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 400;
  return error;
}

function text(value, label, { max = 200, min = 1 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw clientError(
      'INVALID_QUOTE_REQUEST',
      `${label} must be between ${min} and ${max} characters.`
    );
  }
  return value.trim();
}

export function createQuoteRequest(input) {
  const product = findProductById(input?.productId);
  if (!product || product.purchaseMode !== 'quote') {
    throw clientError(
      'QUOTE_PRODUCT_NOT_FOUND',
      'The selected product is not available for a quote.'
    );
  }

  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < product.minimumOrderQuantity || quantity > 100) {
    throw clientError(
      'INVALID_QUOTE_REQUEST',
      'Quantity must be a whole number between 1 and 100.'
    );
  }

  const email = text(input.email, 'Email', { max: 254 });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw clientError('INVALID_QUOTE_REQUEST', 'Enter a valid business email address.');
  }

  return {
    id: randomUUID(),
    productId: product.id,
    productName: product.name,
    quantity,
    companyName: text(input.companyName, 'Company name'),
    contactName: text(input.contactName, 'Contact name'),
    email,
    destinationCountry: text(input.destinationCountry, 'Destination country'),
    notes: typeof input.notes === 'string' ? input.notes.trim().slice(0, 1000) : '',
    status: 'received',
    createdAt: new Date().toISOString()
  };
}
