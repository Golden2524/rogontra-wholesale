ALTER TABLE products
  ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS products_external_id_idx
  ON products(external_id)
  WHERE external_id IS NOT NULL;
