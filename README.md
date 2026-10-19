# ⚡ LinkPulse — High-Performance URL Shortener & Analytics Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Upstash%20Ready-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> **LinkPulse** is a production-ready, full-stack URL shortener and real-time link analytics platform built for speed, security, and enterprise marketing campaigns. Features sub-millisecond non-blocking redirects, dual-layer caching with graceful in-memory fallbacks, asynchronous click tracking with bot filtering, trackable QR codes, CSV bulk imports, and a granular administrative control center.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Strict 6-Rule Redirect Evaluation Engine](#-strict-6-rule-redirect-evaluation-engine)
- [Tech Stack](#-tech-stack)
- [Environment Variables Reference](#-environment-variables-reference)
- [Local Development Setup](#-local-development-setup)
- [Master Demo Data & Default Accounts](#-master-demo-data--default-accounts)
- [Production Deployment Guide](#-production-deployment-guide)
  - [1. PostgreSQL on Neon](#1-postgresql-database-on-neon)
  - [2. Redis on Upstash (Optional)](#2-redis-cache--queue-on-upstash-optional)
  - [3. Backend on Render](#3-backend-web-service-on-render)
  - [4. Frontend on Vercel](#4-frontend-on-vercel)
- [API Reference](#-api-reference)
- [End-to-End Demo Walkthroughs](#-end-to-end-demo-walkthroughs)

---

## 🏛 Architecture Overview

LinkPulse is built with a decoupled client-server architecture designed for high throughput and zero redirect latency:

```mermaid
flowchart TD
    User([Visitor / Scanner]) -->|GET /:shortCode| Engine[Redirect Engine (Express)]
    Engine -->|1. Lookup| Cache[(Redis / In-Memory Cache TTL 60s)]
    Cache -.->|Cache Miss| DB[(PostgreSQL Database)]
    Engine -->|2. Instant 302 Redirect| User
    Engine -->|3. Async Push Non-blocking| Queue[(Redis / Memory Queue)]

    Queue -->|De-queue Job| Worker[Background Click Worker]
    Worker -->|Parse UA, Device & Browser| UAParser[ua-parser-js]
    Worker -->|Detect Bots| BotDetect[isbot]
    Worker -->|Resolve Country| GeoIP[geoip-lite]
    Worker -->|SHA256 Anonymized IP:UA:Date| HashGen[Visitor Hash]
    Worker -->|Batch Insert| ClickTable[(click_events Table)]

    AdminApp[React Dashboard (Vercel)] -->|REST API JWT Bearer| API[API Gateway]
    API --> DB
```

### Key Architectural Highlights:
1. **Zero-Latency Redirect Pipeline:** Redirect evaluation executes immediately from the Redis/in-memory cache. Click telemetry is pushed onto an asynchronous queue so visitors are redirected with HTTP 302 without waiting for database writes.
2. **Graceful Degradation:** Both caching and queue services automatically detect whether `REDIS_URL` is configured. If Redis is unavailable or unconfigured, the system automatically falls back to an in-memory TTL cache and in-memory async worker queue without throwing errors.
3. **Instant Cache Invalidation:** When an admin or user edits, updates, or disables a link, the shortcode's cache key is immediately evicted from Redis and memory, ensuring unauthorized or disabled links stop redirecting in real time.
4. **Bot Filtering & Limits:** Clicks originating from automated scrapers (`isbot`) are logged with `is_bot = true` for security audits, but are strictly excluded from click-limit quotas and conversion analytics.

---

## 🚦 Strict 6-Rule Redirect Evaluation Engine

Every shortcode redirect (`GET /:code`) is evaluated in an immutable, prioritized sequence to guarantee data integrity, security, and accurate analytics:

```
 Incoming Shortcode Request (GET /:code)
                   │
                   ▼
       [ Rule 1: Exists Check ] ── No ──► HTTP 404 (Not Found)
                   │ Yes
                   ▼
       [ Rule 2: Status Active ] ── Disabled ──► HTTP 410 (Gone) + Log blocked click
                   │ Yes
                   ▼
       [ Rule 3: Expiry Check ] ── Expired ──► HTTP 410 (Gone) + Log blocked click
                   │ Yes
                   ▼
       [ Rule 4: Click Limit Check ] ── Limit Reached ──► HTTP 410 (Gone) + Log blocked click
                   │ Yes
                   ▼
       [ Rule 5: Password Protection ] ── Required ──► HTTP 200 (Unlock Form / Verify Token)
                   │ Valid or None
                   ▼
       [ Rule 6: 302 Temporary Redirect ] ──► HTTP 302 Location: destination_url
                   │
                   └──► Async Queue Job: { ip, ua, referrer, query: src }
```

### Rule Evaluation Details:
| Rule | Condition Evaluated | Failure Action | HTTP Status |
|:---:|---|---|:---:|
| **Rule 1** | **Link Exists** | Shortcode not registered in system | `404 Not Found` |
| **Rule 2** | **Status Active** | Link status set to `disabled` (via user or admin) | `410 Gone` *(Blocked event logged)* |
| **Rule 3** | **Not Expired** | `expires_at` is set and `now() >= expires_at` | `410 Gone` *(Blocked event logged)* |
| **Rule 4** | **Under Click Limit** | `click_limit` set and `non_bot_clicks >= click_limit` | `410 Gone` *(Blocked event logged)* |
| **Rule 5** | **Password Verified** | Link has password and request lacks valid unlock cookie | `200 OK` *(Password Prompt Form)* |
| **Rule 6** | **Execute Redirect** | All rules pass: push click to queue and redirect | `302 Found` |

---

## 💻 Tech Stack

- **Backend:** Node.js (18+), Express.js, `pg` (PostgreSQL client pool), `bcrypt`, `jsonwebtoken`, `zod`, `qrcode`, `papaparse`, `ua-parser-js`, `isbot`, `geoip-lite`, `ioredis`.
- **Frontend:** React 19, Vite, React Router v7, Recharts, CSS Variables & TailwindCSS v4 design tokens.
- **Design System:** Sleek developer dark mode: Primary `#00AEEF`, Dark Backgrounds `#202225`, Card Panels `#2F3136`, Borders `#3f4248`.

---

## 🔐 Environment Variables Reference

### Backend (`server/.env`)
| Variable | Required | Default | Description | Production Example |
|---|:---:|---|---|---|
| `PORT` | No | `3001` | Express HTTP server listen port | `3001` |
| `NODE_ENV` | No | `development` | Node environment mode | `production` |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string | `postgres://user:pass@ep-cool-db.us-east-2.neon.tech/linkpulse?sslmode=require` |
| `JWT_SECRET` | **Yes** | `fallback-secret` | 256-bit cryptographically secure secret for JWT signing | `c97f48b1d4e7...` |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token lifetime | `7d` |
| `BASE_URL` | **Yes** | `http://localhost:3001` | Public short link domain (used for short URL links and QR codes) | `https://linkpulse-api.onrender.com` or `https://lp.io` |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin for frontend | `https://linkpulse.vercel.app` |
| `REDIS_URL` | No | `null` | Redis connection URL for distributed caching and queues | `rediss://default:pwd@us1-quick-slug-123.upstash.io:6379` |

### Frontend (`client/.env`)
| Variable | Required | Default | Description | Production Example |
|---|:---:|---|---|---|
| `VITE_API_URL` | No | `""` (relative) | Backend API URL prefix | `https://linkpulse-api.onrender.com` |
| `VITE_SHORT_BASE_URL`| No | Auto-detected | Base domain used when displaying or copying short links | `https://linkpulse-api.onrender.com` |

---

## 🛠 Local Development Setup

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL (v14+ running locally or a free Neon instance)

### 2. Backend Setup
```bash
# Navigate to server directory
cd server

# Copy environment configuration
cp .env.example .env

# Configure your DATABASE_URL in .env
# e.g., DATABASE_URL=postgres://postgres:postgres@localhost:5432/linkpulse

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Run master seed script (creates 3 campaigns, 5 tags, 25 links, 800+ click events)
npm run seed

# Start server in development mode with nodemon
npm run dev
```
The server will start listening at `http://localhost:3001`.

### 3. Frontend Setup
```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 👤 Master Demo Data & Default Accounts

Running `npm run seed` creates a fully-populated demonstration environment:

### Default Credentials
| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@linkpulse.test` | `Admin@123` | Full platform control, enable/disable any link, blocklist manager, user directory, global analytics |
| **Standard User** | `user@linkpulse.test` | `User@123` | Personal workspace, campaigns CRUD, link management, QR studio, CSV import |

### Seeded Assets:
- **3 Campaigns:** `Q4 Product Launch`, `Social Media Blitz 2026`, `Developer Docs & Tutorials`.
- **5 Tags:** `marketing`, `developer`, `social`, `internal`, `beta`.
- **25 Short Links** spanning every functional state:
  - Active standard links (e.g., `/launch-q4`, `/api-docs`)
  - Expired links triggering health alerts (e.g., `/flash-sale-2025`)
  - Expiring soon links expiring within 7 days (e.g., `/spring-promo`)
  - Platform disabled links (e.g., `/old-internal-portal`)
  - Password-protected links (`/investor-deck`, password: `secret123`)
  - Click-limited link (`/limited-first-50`, limit: 35, clicks: 50+ $\rightarrow$ triggers limit alert)
- **~800 Click Events:** Spanning the last 30 days with device breakdowns (Mobile, Desktop, Tablet), browsers (Chrome, Safari, Firefox), countries (US, IN, GB, DE, JP), referrers, ~25% QR code scans, and a targeted Day 3 bot spike to showcase automated threat detection.

---

## 🚀 Production Deployment Guide

Follow this step-by-step checklist to deploy LinkPulse completely on free-tier cloud infrastructure:

### 1. PostgreSQL Database on Neon
1. Go to [Neon Console](https://console.neon.tech/) and click **"Create Project"**.
2. Name the project `linkpulse` and choose your preferred region.
3. In the project dashboard, copy the **Connection string** (choose Postgres dialect, `Pooled connection`).
4. Note this connection string as your `DATABASE_URL`. It will look like:
   ```
   postgres://username:password@ep-cold-shadow-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Redis Cache & Queue on Upstash (Optional)
1. Go to [Upstash Console](https://console.upstash.com/) and click **"Create Database"**.
2. Select **Redis**, pick a region close to your Neon database, and click **Create**.
3. Under the **Node.js** tab, copy the **`REDIS_URL`** connection string:
   ```
   rediss://default:your_upstash_password@us1-linkpulse-123.upstash.io:6379
   ```

### 3. Backend Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + $\rightarrow$ Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name:** `linkpulse-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run migrate && npm run seed`
   - **Start Command:** `npm start`
4. In the **Environment Variables** section, configure:
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgres://username:password@ep-cold-shadow-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your_super_secret_random_key_here
   JWT_EXPIRES_IN=7d
   BASE_URL=https://linkpulse-api.onrender.com
   CLIENT_URL=https://linkpulse.vercel.app
   REDIS_URL=rediss://default:your_upstash_password@us1-linkpulse-123.upstash.io:6379
   ```
   *(Replace with your actual Render and Vercel domains)*
5. Click **Deploy Web Service**.

> **Note on `BASE_URL`:** The `BASE_URL` environment variable controls the domain used when generating short links and QR codes. If you attach a custom domain (e.g. `https://lp.io`), set `BASE_URL=https://lp.io`.

### 4. Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New... $\rightarrow$ Project"**.
2. Import your Git repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `client`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, set:
   ```env
   VITE_API_URL=https://linkpulse-api.onrender.com
   VITE_SHORT_BASE_URL=https://linkpulse-api.onrender.com
   ```
5. Click **Deploy**.
6. The included `client/vercel.json` automatically handles Single Page Application client routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 📡 API Reference

### Public & Authentication
- `POST /api/auth/register` — Create account (`email`, `password`, `name`)
- `POST /api/auth/login` — Login & receive JWT Bearer token
- `GET /api/auth/me` — Inspect current user session & role
- `GET /:code` — Public redirect engine (strictly evaluates rules 1–6)
- `POST /:code/unlock` — Unlock password-protected shortcode

### Links & QR Codes
- `POST /api/links/validate` — Pre-flight validation (format, blocklist, reserved alias, warnings)
- `POST /api/links` — Create link (Rate limit: 20 req/min)
- `GET /api/links` — List user's links (pagination, search, tag filter)
- `GET /api/links/:id` — Get link details
- `PATCH /api/links/:id` — Update destination, status, expiry, limits, password
- `DELETE /api/links/:id` — Soft-disable link
- `GET /api/links/:id/analytics` — Detailed time-series, referrers, device, browser, country stats
- `GET /api/links/:id/qr` — Generate PNG / SVG QR code with `?src=qr`
- `GET /api/links/:id/qr-info` — Inspect QR scan conversion metrics
- `POST /api/links/import` — CSV bulk link import with dry-run preview

### Campaigns & Tags
- `GET /api/campaigns` — List user campaigns with aggregated stats
- `POST /api/campaigns` — Create campaign
- `GET /api/campaigns/:id` — Deep campaign stats & top-performing links
- `PATCH /api/campaigns/:id` — Update campaign
- `DELETE /api/campaigns/:id` — Delete campaign
- `GET /api/tags` — List user tags with link count
- `POST /api/tags` — Create tag
- `DELETE /api/tags/:id` — Delete tag
- `POST /api/links/:id/tags` — Attach tag to link
- `DELETE /api/links/:id/tags/:tagId` — Detach tag from link

### Dashboard & Admin Controls
- `GET /api/dashboard?period=7d|30d|90d` — KPIs, trend area charts, campaign bars, top links, health alerts
- `GET /api/admin/stats` — Platform-wide analytics (Admin only)
- `GET /api/admin/links` — Platform-wide links directory (Admin only)
- `POST /api/admin/links/:id/disable` — Instant disable with cache invalidation (Admin only)
- `POST /api/admin/links/:id/enable` — Instant enable with cache invalidation (Admin only)
- `GET /api/admin/users` — Platform users directory (Admin only)
- `GET /api/admin/blocked-domains` — List blocked domains (Admin only)
- `POST /api/admin/blocked-domains` — Add domain to blocklist (Admin only)
- `DELETE /api/admin/blocked-domains/:id` — Remove domain from blocklist (Admin only)

---

## 🧪 End-to-End Demo Walkthroughs

### Scenario 1: Create Link $\rightarrow$ Track via QR Scan $\rightarrow$ Verify Analytics
1. **Login:** Log in as `user@linkpulse.test` (`User@123`).
2. **Create Short Link:** Click **+ Create Link**, enter `https://github.com/facebook/react` and alias `react-demo`.
3. **Step 2 Settings:** Assign to campaign `Developer Docs & Tutorials`, add tag `frontend`, and click **Publish Link**.
4. **Inspect QR Code:** Go to **QR Codes** in the sidebar. Select `/react-demo`. Notice the URL contains `?src=qr`. Download the SVG or PNG.
5. **Simulate QR Visit:** Open a new browser tab and navigate to `http://localhost:3001/react-demo?src=qr`. You are instantly redirected to React's GitHub page.
6. **Verify Attribution:** Return to LinkPulse and visit **Links $\rightarrow$ /react-demo $\rightarrow$ Analytics**. Notice the QR scan attribution tile has incremented, and source `"qr"` appears in the analytics breakdown.

### Scenario 2: Bulk CSV Import $\rightarrow$ Admin Platform Disable $\rightarrow$ Cache Invalidation Check
1. **Bulk CSV Import:** In the Links page, click **📥 Import CSV**.
2. **Download Template / Paste CSV:** Click "Download sample CSV" or paste:
   ```csv
   destination_url,alias,campaign,tags,expires_at
   https://vite.dev,vite-quickstart,Developer Docs & Tutorials,"vite,bundler",
   ```
3. **Preview & Confirm:** Click **Review & Preview**. Inspect the valid rows count, then click **Execute Import**. The link `/vite-quickstart` is created.
4. **Switch to Admin:** Sign out and log in as `admin@linkpulse.test` (`Admin@123`).
5. **Admin Disable:** Navigate to the **Admin** panel $\rightarrow$ **All Links** tab. Locate `/vite-quickstart` and click **🚫 Disable**.
6. **Verify Immediate 410 Gone:** In your browser or terminal, attempt to visit `http://localhost:3001/vite-quickstart`.
   ```bash
   curl -i http://localhost:3001/vite-quickstart
   ```
   **Result:** The redirect engine returns `HTTP 410 Gone` with message `"This link has been disabled"`. Because the cache was instantly invalidated, the disable action took effect with zero delay!

---

## 📄 License
MIT License. Built for hackathons, engineering showcases, and production workloads.
