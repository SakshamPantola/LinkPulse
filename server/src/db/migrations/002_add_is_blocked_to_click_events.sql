
-- Migration: Add blocked flag for malicious redirect tracking


ALTER TABLE click_events
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_click_events_is_blocked ON click_events(is_blocked);

