-- Migration: Add atomic clicks counter to links for zero-race-condition click limits
ALTER TABLE links
ADD COLUMN IF NOT EXISTS clicks INT NOT NULL DEFAULT 0;

-- Backfill existing clicks from click_events if any
UPDATE links l
SET clicks = COALESCE((
  SELECT COUNT(*)::int
  FROM click_events ce
  WHERE ce.link_id = l.id
    AND ce.is_bot = false
    AND ce.is_blocked = false
), 0);

CREATE INDEX IF NOT EXISTS idx_links_clicks ON links(clicks);
