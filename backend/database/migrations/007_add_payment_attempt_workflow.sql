ALTER TABLE payment_attempts
  ADD CONSTRAINT payment_attempts_status_check
  CHECK (status IN ('initialized', 'pending', 'success', 'failed'));

CREATE INDEX IF NOT EXISTS payment_attempts_order_id_idx ON payment_attempts(order_id);
