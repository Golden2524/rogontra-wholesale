ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quote_requests_user_id_idx ON quote_requests(user_id);
