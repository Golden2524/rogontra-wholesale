const deliveryOptions = new Map([
  ['1', { deliveryDays: 7, id: '1', shippingPriceCents: 0 }],
  ['2', { deliveryDays: 3, id: '2', shippingPriceCents: 499 }],
  ['3', { deliveryDays: 1, id: '3', shippingPriceCents: 999 }]
]);

export function getDeliveryOption(deliveryOptionId) {
  return deliveryOptions.get(deliveryOptionId);
}

export function calculateEstimatedDeliveryTime(deliveryDays, orderTime) {
  const deliveryTime = new Date(orderTime);
  deliveryTime.setUTCDate(deliveryTime.getUTCDate() + deliveryDays);
  return deliveryTime.toISOString();
}
