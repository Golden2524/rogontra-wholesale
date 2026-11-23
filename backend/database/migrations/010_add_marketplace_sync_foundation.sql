CREATE TABLE IF NOT EXISTS marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('jumia', 'amazon', 'other')),
  marketplace_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (status IN ('not_connected', 'pending_authorization', 'connected', 'paused', 'disabled')),
  credential_reference TEXT,
  last_successful_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, marketplace_code)
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  marketplace_listing_id TEXT NOT NULL,
  marketplace_sku TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'failed', 'disabled')),
  last_synced_at TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (connection_id, product_id),
  UNIQUE (connection_id, marketplace_listing_id)
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES marketplace_connections(id) ON DELETE RESTRICT,
  marketplace_order_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  sync_status TEXT NOT NULL DEFAULT 'received'
    CHECK (sync_status IN ('received', 'imported', 'failed', 'cancelled')),
  external_updated_at TIMESTAMPTZ,
  payload_hash CHAR(64),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (connection_id, marketplace_order_id)
);

CREATE TABLE IF NOT EXISTS marketplace_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'inventory', 'order')),
  direction TEXT NOT NULL CHECK (direction IN ('import', 'export')),
  operation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'succeeded', 'failed', 'skipped')),
  external_reference TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketplace_listings_product_id_idx
  ON marketplace_listings (product_id);

CREATE INDEX IF NOT EXISTS marketplace_orders_order_id_idx
  ON marketplace_orders (order_id);

CREATE INDEX IF NOT EXISTS marketplace_sync_events_connection_created_idx
  ON marketplace_sync_events (connection_id, created_at DESC);

INSERT INTO schema_migrations (version) VALUES ('010_add_marketplace_sync_foundation') ON CONFLICT DO NOTHING;
