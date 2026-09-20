import { randomUUID } from 'node:crypto';

import { findProductById } from './catalogue.js';
import { calculateEstimatedDeliveryTime, getDeliveryOption } from './delivery.js';

const TAX_RATE = 0.1;
const MAX_CART_ITEMS = 50;

function createClientError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 400;
  return error;
}

function validateCartItem(item) {
  if (!item || typeof item !== 'object') {
    throw createClientError('INVALID_CART', 'Every cart item must be an object.');
  }

  if (typeof item.productId !== 'string' || !item.productId) {
    throw createClientError('INVALID_CART', 'Every cart item needs a product ID.');
  }

  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
    throw createClientError(
      'INVALID_CART',
      'Every cart quantity must be an integer from 1 to 100.'
    );
  }

  if (typeof item.deliveryOptionId !== 'string') {
    throw createClientError('INVALID_CART', 'Every cart item needs a delivery option.');
  }
}

export function createOrderFromCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > MAX_CART_ITEMS) {
    throw createClientError(
      'INVALID_CART',
      `Cart must contain between 1 and ${MAX_CART_ITEMS} items.`
    );
  }

  const productIds = new Set();
  const orderTime = new Date().toISOString();
  let productPriceCents = 0;
  let shippingPriceCents = 0;

  const products = cart.map((item) => {
    validateCartItem(item);

    if (productIds.has(item.productId)) {
      throw createClientError('INVALID_CART', 'A product can appear only once in a cart.');
    }
    productIds.add(item.productId);

    const product = findProductById(item.productId);
    if (!product) {
      throw createClientError('CART_PRODUCT_NOT_FOUND', 'A product in the cart no longer exists.');
    }

    const deliveryOption = getDeliveryOption(item.deliveryOptionId);
    if (!deliveryOption) {
      throw createClientError(
        'INVALID_DELIVERY_OPTION',
        'A selected delivery option is not available.'
      );
    }

    productPriceCents += product.priceCents * item.quantity;
    shippingPriceCents += deliveryOption.shippingPriceCents;

    return {
      productId: product.id,
      quantity: item.quantity,
      estimatedDeliveryTime: calculateEstimatedDeliveryTime(deliveryOption.deliveryDays, orderTime)
    };
  });

  const subtotalCents = productPriceCents + shippingPriceCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);

  return {
    id: randomUUID(),
    orderTime,
    status: 'awaiting_payment',
    paymentStatus: 'not_collected',
    currency: 'USD',
    products,
    productPriceCents,
    shippingPriceCents,
    taxCents,
    totalCostCents: subtotalCents + taxCents
  };
}
