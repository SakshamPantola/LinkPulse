# 📈 LinkPulse Telemetry Metrics & Data Dictionary
*Authored by Tushar Tiwari (@tiwaritushar02)*

## Key Performance Indicators (KPIs)

### 1. Total Clicks vs Human Clicks
- **Total Clicks**: Absolute tally of all HTTP GET requests received on a short link code.
- **Human Clicks**: Cleaned engagement metric that filters out automated web scrapers, link preview bots (Slackbot, Twitterbot, WhatsApp preview), and search indexing spiders.

### 2. Device Family Normalization
User agent strings are parsed and categorized into standard buckets:
- `desktop`: Windows, macOS, Linux workstations.
- `mobile`: iOS iPhones, Android handsets.
- `tablet`: iPads, Galaxy Tabs, surface tablets.
- `other`: Unidentified embedded webviews.

### 3. Traffic Channel Attribution
- **Direct**: Requests where the `Referer` HTTP header is empty or undefined (e.g., bookmarks, SMS links, terminal curl).
- **Social**: Requests originating from registered social platforms (Twitter/X, LinkedIn, Reddit, Instagram, Facebook).
- **Search**: Inbound traffic from search engines (Google, Bing, DuckDuckGo, Yahoo).
- **Referral**: All other external web domains redirecting to the gateway.

### 4. Scan Attribution Index
Isolates engagements originating from camera QR scans versus standard hyperlinked text clicks, allowing marketing teams to calculate offline print campaign ROI.
