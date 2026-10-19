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

function validateDeliveryAddress(address) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    throw createClientError('INVALID_DELIVERY_ADDRESS', 'A delivery address is required.');
  }

  const requiredFields = [
    ['recipientName', 2, 200, 'recipient name'],
    ['addressLine1', 5, 200, 'address line'],
    ['city', 2, 100, 'city'],
    ['country', 2, 100, 'country'],
    ['phone', 5, 40, 'phone number']
  ];
  for (const [field, minimum, maximum, label] of requiredFields) {
    const value = address[field];
    if (
      typeof value !== 'string' ||
      value.trim().length < minimum ||
      value.trim().length > maximum
    ) {
      throw createClientError('INVALID_DELIVERY_ADDRESS', `A valid delivery ${label} is required.`);
    }
  }

  if (
    address.addressLine2 !== undefined &&
    (typeof address.addressLine2 !== 'string' || address.addressLine2.length > 200)
  ) {
    throw createClientError('INVALID_DELIVERY_ADDRESS', 'Delivery address line 2 is invalid.');
  }
  if (
    address.postalCode !== undefined &&
    (typeof address.postalCode !== 'string' || address.postalCode.length > 30)
  ) {
    throw createClientError('INVALID_DELIVERY_ADDRESS', 'Delivery postal code is invalid.');
  }

  return {
    recipientName: address.recipientName.trim(),
    addressLine1: address.addressLine1.trim(),
    addressLine2: address.addressLine2?.trim() ?? '',
    city: address.city.trim(),
    country: address.country.trim(),
    postalCode: address.postalCode?.trim() ?? '',
    phone: address.phone.trim()
  };
}

export async function createOrderFromCart(cart, deliveryAddress, findProduct = findProductById) {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > MAX_CART_ITEMS) {
    throw createClientError(
      'INVALID_CART',
      `Cart must contain between 1 and ${MAX_CART_ITEMS} items.`
    );
  }

  const productIds = new Set();
  const validatedDeliveryAddress = validateDeliveryAddress(deliveryAddress);
  const orderTime = new Date().toISOString();
  let productPriceCents = 0;
  let shippingPriceCents = 0;

  const products = [];
  for (const item of cart) {
    validateCartItem(item);

    if (productIds.has(item.productId)) {
      throw createClientError('INVALID_CART', 'A product can appear only once in a cart.');
    }
    productIds.add(item.productId);

    const product = await findProduct(item.productId);
    if (!product) {
      throw createClientError('CART_PRODUCT_NOT_FOUND', 'A product in the cart no longer exists.');
    }

    if (product.purchaseMode !== 'checkout' || product.priceCents === null) {
      throw createClientError(
        'QUOTE_REQUIRED',
        'This product requires a sales-assisted quote and cannot be ordered online.'
      );
    }

    if (item.quantity < product.minimumOrderQuantity) {
      throw createClientError(
        'MINIMUM_ORDER_QUANTITY_NOT_MET',
        `${product.name} requires a minimum order quantity of ${product.minimumOrderQuantity}.`
      );
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

    products.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      estimatedDeliveryTime: calculateEstimatedDeliveryTime(deliveryOption.deliveryDays, orderTime)
    });
  }

  const subtotalCents = productPriceCents + shippingPriceCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);

  return {
    id: randomUUID(),
    orderTime,
    status: 'awaiting_payment',
    paymentStatus: 'not_collected',
    currency: 'USD',
    deliveryAddress: validatedDeliveryAddress,
    products,
    productPriceCents,
    shippingPriceCents,
    taxCents,
    totalCostCents: subtotalCents + taxCents
  };
}
