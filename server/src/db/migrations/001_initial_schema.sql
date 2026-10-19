-- LinkPulse — initial schema
-- Run via: npm run migrate

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100),
  role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Campaigns ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Links ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code      VARCHAR(20)  NOT NULL,
  destination_url TEXT         NOT NULL,
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id     UUID         REFERENCES campaigns(id) ON DELETE SET NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'disabled')),
  expires_at      TIMESTAMPTZ,
  click_limit     INT,
  password_hash   VARCHAR(255),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Fast lookup for redirects
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);

-- ─── Tags ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)          -- each user's tag names are unique
);

-- ─── Link ↔ Tag (many-to-many) ──────────────────────────────
CREATE TABLE IF NOT EXISTS link_tags (
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- ─── Click Events (append-only analytics table) ─────────────
CREATE TABLE IF NOT EXISTS click_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id      UUID        NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer     TEXT,
  device       VARCHAR(50),
  browser      VARCHAR(50),
  country      VARCHAR(10),
  is_bot       BOOLEAN     NOT NULL DEFAULT false,
  visitor_hash VARCHAR(64),
  source       VARCHAR(10) NOT NULL DEFAULT 'link'
               CHECK (source IN ('link', 'qr'))
);

-- Analytics queries filter by link + time range
CREATE INDEX IF NOT EXISTS idx_click_events_link_id    ON click_events(link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);

-- ─── Blocked Domains (admin-managed) ────────────────────────
CREATE TABLE IF NOT EXISTS blocked_domains (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain     VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
