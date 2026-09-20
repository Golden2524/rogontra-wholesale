import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';

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

/*
function isWeekend(date) {
  const dayOfWeek = date.format('dddd');

  return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
}

export function calculateDeliveryDate(deliveryOption) {
  let remainingDays = deliveryOption.deliveryDays;
  let deliveryDate = dayjs();

  while (remainingDays > 0) {
    deliveryDate = deliveryDate.add(1, 'day');

    if (!isWeekend(deliveryDate)) {
      remainingDays--;
    }
  }

  const dateString = deliveryDate.format(
    'dddd, MMMM D'
  );
  return dateString;
}
*/

export function calculateDeliveryDate(deliveryOption) {
  const today = dayjs();
  const deliveryDate = today.add(deliveryOption.deliveryDays, 'days');

  const dateString = deliveryDate.format('dddd, MMMM D');
  return dateString;
}
