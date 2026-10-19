<div align="center">

# ⚡ LinkPulse

### **Next-Gen URL Management, Dynamic QR Engine & Real-Time Analytics Platform**

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-6366f1?style=for-the-badge&logo=vercel)](https://link-pulse-delta.vercel.app)
[![API Status](https://img.shields.io/badge/API-Live%20on%20Render-46E3B7?style=for-the-badge&logo=render)](https://linkpulse-fbk6.onrender.com/health)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-00E699?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

*Built for speed, security, and deep marketing insights.*

[🌐 Live Demo](https://link-pulse-delta.vercel.app) • [📖 Documentation](#-api-endpoints) • [🛠️ Architecture](#-system-architecture) • [🚀 Quick Start](#-quick-start)

---

</div>

## 💡 What is LinkPulse?

**LinkPulse** is a production-ready, full-stack link intelligence and analytics platform engineered for modern marketing campaigns and high-throughput redirection. Beyond simple URL shortening, LinkPulse acts as a **smart gateway** with built-in cybersecurity audits, automated bot filtering, geographical telemetry, and asynchronous analytics ingestion.

---

## ✨ Key Features

### 🛡️ 1. Intelligent Security & URL Auditing
- **Real-Time Risk Scoring**: Scans destination URLs for chained shorteners (obfuscation attacks), malformed protocols, and suspicious redirect loops.
- **Phishing & Domain Shield**: Admin-configurable domain blocking system that halts malicious traffic before redirection.
- **Password Protection**: Encrypt sensitive links with industry-standard **bcrypt** hashing.
- **Expiration & Click Limits**: Set links to automatically expire after reaching a click threshold or timestamp.

### 📊 2. Deep Real-Time Analytics
- **Geo-Location Telemetry**: Country-level breakdown with IP-based spatial resolution (`geoip-lite`).
- **Device & Browser Fingerprinting**: Automated normalization of user agents into Mobile, Desktop, Tablet, and Browser distributions.
- **Automated Bot Filtering**: Strips out crawlers, scrapers, and preview bots (`isbot`) to preserve data integrity.
- **Referrer Tracking**: Categorizes traffic sources (Direct, Social, Search Engines, Referral domains).

### 🏷️ 3. Campaign & Tag Orchestration
- **Campaign Groups**: Group links under marketing initiatives (e.g., *Summer Launch*, *Twitter Ads*).
- **Multi-Tag Filtering**: Tag, search, and aggregate click data across multiple distributed links.
- **Custom Vanity Aliases**: Human-readable short codes (`linkpulse.app/my-custom-name`).

### 📱 4. Dynamic QR Code Engine
- Real-time client-side QR generation with customizable error correction levels.
- Direct **SVG / PNG export** ready for print and digital marketing collateral.

### ⚡ 5. High-Throughput Redirection Engine
- Sub-millisecond lookup via **in-memory / Redis caching**.
- **Asynchronous Click Ingestion**: Click events are queued and written to PostgreSQL asynchronously by a background worker, ensuring zero latency penalty for end-users.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([🌐 End User]) -->|1. Clicks Short Link| RedirectEngine[⚡ Redirection Engine]
    
    subgraph Backend [Server: Express.js on Render]
        RedirectEngine -->|Check Cache| Cache[(Redis / In-Memory Cache)]
        Cache -.->|Cache Miss| DB[(Neon PostgreSQL)]
        RedirectEngine -->|2. HTTP 302 Redirect| Dest([🎯 Target Destination])
        RedirectEngine -->|3. Async Dispatch| Worker[⚙️ Background Click Worker]
    end

    subgraph AnalyticsPipeline [Telemetry & Enrichment]
        Worker --> Geo[🌍 GeoIP Resolver]
        Worker --> UA[📱 Device & UA Parser]
        Worker --> Bot[🤖 Bot Detection Filter]
        Geo & UA & Bot --> Ingest[(PostgreSQL click_events)]
    end

    subgraph ClientApp [Frontend: React + Vite on Vercel]
        Marketer([👨‍💻 Marketer / Admin]) -->|Manage & View Analytics| Dashboard[📊 LinkPulse Glassmorphic Dashboard]
        Dashboard -->|REST API with JWT| AuthAPI[🔐 Authenticated API Routes]
        AuthAPI --> DB
    end
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS Design System, Chart/Canvas Visuals |
| **Backend** | Node.js, Express, Helmet, CORS, Nanoid, Zod Validation |
| **Database** | PostgreSQL with `pgcrypto` UUIDs, Neon Serverless Postgres |
| **Security & Auth** | JWT (JSON Web Tokens), bcrypt hashing, Rate Limiting |
| **Telemetry** | `geoip-lite`, `ua-parser-js`, `isbot`, SHA-256 Visitor Hashing |
| **Deployment** | Vercel (Client SPA) + Render (API Server) + Neon (Cloud DB) |

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/SakshamPantola/LinkPulse.git
cd LinkPulse
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```

Configure your `.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

Run database migrations:
```bash
npm run migrate
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_SHORT_BASE_URL=http://localhost:3001
```

Start the client:
```bash
npm run dev
```

Access the app at: `http://localhost:5173`

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Retrieve authenticated user profile

### 🔗 Link Management
- `POST /api/links` — Create a new short link (supports custom alias, password, expiration)
- `GET /api/links` — List all links with paginated search & tag filtering
- `GET /api/links/:id` — Get detailed configuration for a specific link
- `PATCH /api/links/:id` — Update destination, click limit, or status
- `DELETE /api/links/:id` — Permanently delete a short link

### 📈 Analytics & Metrics
- `GET /api/stats/overview` — High-level user metrics (total links, clicks, top referrers)
- `GET /api/stats/:linkId` — Granular telemetry (time-series, country breakdown, devices)

### ⚡ Redirection
- `GET /:shortCode` — Ultra-fast 302 redirect with asynchronous telemetry recording
- `POST /:shortCode/verify` — Password verification for protected links

---

## 🔒 Security Best Practices Implemented

- **Rate Limiting**: Defends authentication and redirection endpoints against brute-force attacks.
- **SQL Injection Prevention**: 100% parameterized queries via `node-postgres` (`pg`).
- **Strict Input Validation**: Zod schema enforcement across all payloads.
- **Safe Headers**: Configured with `helmet` for defensive HTTP response headers.

