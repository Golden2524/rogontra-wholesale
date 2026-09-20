export const orders = JSON.parse(localStorage.getItem('rogontra-orders-v1')) || [];

export function addOrder(order) {
  orders.unshift(order);

  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem('rogontra-orders-v1', JSON.stringify(orders));
}

export function getOrder(orderId) {
  let matchingOrder;

  orders.forEach((order) => {
    if (order.id === orderId) {
      matchingOrder = order;
    }
  });

  return matchingOrder;
}
