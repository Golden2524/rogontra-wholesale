ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('awaiting_payment', 'preparing', 'dispatched', 'delivered', 'cancelled'));

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('not_collected', 'paid', 'failed', 'refunded'));
