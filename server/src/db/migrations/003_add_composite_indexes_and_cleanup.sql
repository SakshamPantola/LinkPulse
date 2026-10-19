CREATE INDEX IF NOT EXISTS idx_click_events_link_clicked_at 
  ON click_events (link_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_bot_filter 
  ON click_events (link_id, is_bot, is_blocked) 
  WHERE is_bot = false AND is_blocked = false;

CREATE INDEX IF NOT EXISTS idx_click_events_country 
  ON click_events (link_id, country) 
  WHERE country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_click_events_device 
  ON click_events (link_id, device);

CREATE INDEX IF NOT EXISTS idx_click_events_browser 
  ON click_events (link_id, browser);

CREATE INDEX IF NOT EXISTS idx_links_user_created 
  ON links (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_links_campaign 
  ON links (campaign_id) 
  WHERE campaign_id IS NOT NULL;
