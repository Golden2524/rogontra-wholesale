import { formatDeliveryDate } from '../scripts/utils/date.js';

export const deliveryOptions = [
  {
    id: '1',
    deliveryDays: 7,
    shippingPriceCents: 0
  },
  {
    id: '2',
    deliveryDays: 3,
    shippingPriceCents: 499
  },
  {
    id: '3',
    deliveryDays: 1,
    shippingPriceCents: 999
  }
];

export function getDeliveryOption(deliveryOptionId) {
  let deliveryOption;

  deliveryOptions.forEach((option) => {
    if (option.id === deliveryOptionId) {
      deliveryOption = option;
    }
  });

  return deliveryOption || deliveryOptions[0];
}

export function calculateDeliveryDate(deliveryOption) {
  return formatDeliveryDate(deliveryOption.deliveryDays);
}
