ALTER TABLE quote_requests
  ADD CONSTRAINT quote_requests_status_check
  CHECK (status IN ('received', 'reviewing', 'quoted', 'closed', 'cancelled'));
