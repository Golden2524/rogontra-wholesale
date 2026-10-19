function toDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('A valid date is required.');
  return date;
}

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric'
});

const monthDayYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

const weekdayMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
});

export function formatMonthDay(value) {
  return monthDayFormatter.format(toDate(value));
}

export function formatMonthDayYear(value) {
  return monthDayYearFormatter.format(toDate(value));
}

export function formatDeliveryDate(deliveryDays, from = new Date()) {
  if (!Number.isInteger(deliveryDays) || deliveryDays < 0) {
    throw new Error('Delivery days must be a non-negative integer.');
  }
  const date = toDate(from);
  date.setDate(date.getDate() + deliveryDays);
  return weekdayMonthDayFormatter.format(date);
}
