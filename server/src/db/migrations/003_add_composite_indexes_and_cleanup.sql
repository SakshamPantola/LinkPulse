-- ====================================================================
-- LinkPulse Migration 003: Performance Optimization & Composite Indexes
-- Designed & Authored by Sarthak Bhatt (@SarthakBhatt55)
-- ====================================================================

-- 1. Accelerate time-series telemetry aggregations per short link
CREATE INDEX IF NOT EXISTS idx_click_events_link_clicked_at 
  ON click_events (link_id, clicked_at DESC);

-- 2. Optimize bot & scraper exclusion queries in telemetry analytics
CREATE INDEX IF NOT EXISTS idx_click_events_bot_filter 
  ON click_events (link_id, is_bot, is_blocked) 
  WHERE is_bot = false AND is_blocked = false;

-- 3. Speed up country-level spatial telemetry resolution
CREATE INDEX IF NOT EXISTS idx_click_events_country 
  ON click_events (link_id, country) 
  WHERE country IS NOT NULL;

-- 4. Speed up device & browser aggregation lookups
CREATE INDEX IF NOT EXISTS idx_click_events_device 
  ON click_events (link_id, device);

CREATE INDEX IF NOT EXISTS idx_click_events_browser 
  ON click_events (link_id, browser);

-- 5. Accelerate user link listing filtered by campaigns
CREATE INDEX IF NOT EXISTS idx_links_user_created 
  ON links (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_links_campaign 
  ON links (campaign_id) 
  WHERE campaign_id IS NOT NULL;
