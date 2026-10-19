ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address JSONB;

CREATE INDEX IF NOT EXISTS orders_delivery_country_idx
  ON orders ((delivery_address->>'country'));

INSERT INTO schema_migrations (version) VALUES ('008_add_order_delivery_snapshot') ON CONFLICT DO NOTHING;
