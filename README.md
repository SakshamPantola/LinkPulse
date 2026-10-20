<div align="center">

# ⚡ LinkPulse

### **Enterprise URL Gateway, Dynamic QR Engine & Real-Time Analytics Platform**
*Developed with ❤️ by Team **PLATFORM404***

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-6366f1?style=for-the-badge&logo=vercel)](https://link-pulse-delta.vercel.app)
[![API Status](https://img.shields.io/badge/API-Live%20on%20Render-46E3B7?style=for-the-badge&logo=render)](https://linkpulse-fbk6.onrender.com/health)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-00E699?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[🌐 Live Demo](https://link-pulse-delta.vercel.app) • [🚀 Quick Start](#-quick-start--local-setup) • [🔐 Admin Access](#-official-demo--admin-access) • [📸 Screenshots](#-product-walkthrough--visual-showcase) • [🏗️ Architecture](#️-system-architecture) • [🔄 DFD Diagrams](#-data-flow-diagrams-dfd) • [🗄️ ER Diagram](#️-entity-relationship-diagram-erd) • [👥 Team](#-team-platform404)

---

</div>

## 🔐 Official Demo & Platform Access

For evaluator, judge, and platform reviewer convenience:

| Role | Access / Email | Password | Privileges Included |
| :--- | :--- | :--- | :--- |
| **👑 Super Admin** | `platform404@gmail.com` | `Admin@123` | **Full Platform Oversight**: Access to `/admin`, universal link enable/disable kill-switch, phishing domain blacklist manager, user directory, and platform-wide telemetry graphs. |
| **👤 Standard User** | **Register Account** (Click **Sign Up**) | *(Set your own)* | Register your own account directly to test short link creation, vanity aliases, password locking, QR studio, campaigns, and personal link analytics. |

> 💡 **Quick Access**:
> - **Admin Oversight**: Visit [https://link-pulse-delta.vercel.app](https://link-pulse-delta.vercel.app) and sign in using `platform404@gmail.com` / `Admin@123` to review full administrative features and security telemetry.
> - **Standard User Experience**: Agar khud user banke test karna hai, toh platform par direct **Sign Up / Register** karke instant account bana sakte hain (*Simply click **Sign Up** to register a fresh user account and test standard link workflows*).

---

## 📸 Product Walkthrough & Visual Showcase

| 📊 Real-Time Analytics Dashboard | 🔗 Active Links Management Table |
| :---: | :---: |
| <img src="./screenshots/dashboard.png" width="100%" alt="Real-Time Analytics Dashboard" /> | <img src="./screenshots/links.png" width="100%" alt="Active Links Management Table" /> |
| *Real-time click trends, top referrers, active vs disabled links* | *Custom vanity aliases, status toggles, password lock badges* |

| 👑 Admin Control Panel & Domain Shield | 🛡️ Link Creation & Password Protection |
| :---: | :---: |
| <img src="./screenshots/admin.png" width="100%" alt="Admin Control Panel" /> | <img src="./screenshots/create_link.png" width="100%" alt="Link Creation Interface" /> |
| *Platform analytics, global link kill-switch, domain blacklist* | *Expiry limits, bcrypt password lock, tags & campaign grouping* |

<div align="center">

### 🔐 Clean Authentication Interface
<img src="./screenshots/Signin_png.png" width="75%" alt="Authentication Interface" />

*High-contrast responsive glassmorphic authentication with strict Role-Based Access Control (RBAC)*

</div>

---

## 🎯 Problem Statement

Traditional URL shorteners simply truncate links without verifying their authenticity, security, or audience context. In modern web environments, teams face:
1. **Security & Phishing Threats**: Malicious destination URLs and chained shorteners mask malware distribution and credential harvesting.
2. **Data Distortion**: Bots, web crawlers, and preview scrapers artificially inflate click metrics, distorting campaign ROI.
3. **Lack of Unified Attribution**: Marketers cannot differentiate between organic digital clicks, physical print scans, geographic origins, or device breakdowns without stitching multiple expensive SaaS tools together.
4. **Latency Penalties**: Synchronous telemetry collection causes sluggish redirection speeds, negatively impacting conversion rates.

---

## 💡 Our Solution: LinkPulse

**LinkPulse** is a full-stack, enterprise-grade link management and analytics platform engineered to act as a **smart gateway**. It combines sub-millisecond redirection with an asynchronous telemetry ingestion engine, automated cybersecurity risk scoring, crawler filtering, and dynamic branded QR code generation.

---

## ✨ Key Platform Features

### 🛡️ 1. Intelligent Security & URL Auditing
- **Real-Time Risk Scoring**: Scans destination URLs for chained shorteners (obfuscation attacks), malformed protocols, and suspicious redirect loops.
- **Phishing & Domain Firewall**: Configurable domain blocking system that halts malicious traffic before redirection.
- **Password Protection**: Encrypt sensitive links with industry-standard **bcrypt** hashing.
- **Expiration & Click Limits**: Set links to automatically expire after reaching a click threshold or timestamp.

### 📊 2. Deep Real-Time Analytics
- **Geo-Location Telemetry**: Country-level breakdown with IP-based spatial resolution (`geoip-lite`).
- **Device & Browser Fingerprinting**: Automated normalization of user agents into Mobile, Desktop, Tablet, and Browser distributions.
- **Automated Bot Filtering**: Strips out crawlers, scrapers, and preview bots (`isbot`) to preserve data integrity.
- **Referrer Tracking**: Categorizes traffic sources (Direct, Social, Search Engines, Referral domains).

### 👑 3. Centralized Admin Governance
- **Platform Analytics**: Total users, global link tally, platform click volume, and top target domains.
- **Emergency Kill-Switch**: Disable or re-enable any link across the entire platform with instant in-memory cache invalidation.
- **Blocked Domains Shield**: Add, inspect, and remove malicious domains with automatic subdomain enforcement.

### 🏷️ 4. Campaign & Tag Orchestration
- **Campaign Groups**: Group links under marketing initiatives (e.g., *Summer Launch*, *Twitter Ads*).
- **Multi-Tag Filtering**: Tag, search, and aggregate click data across multiple distributed links.
- **Custom Vanity Aliases**: Human-readable short codes (`/my-custom-name`).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([🌐 End User / Scanner]) -->|1. HTTP GET Short Code| RedirectEngine[⚡ Redirection Gateway]
    
    subgraph Backend [Server: Express.js on Render]
        RedirectEngine -->|Check Fast Cache| Cache[(Redis / In-Memory Cache)]
        Cache -.->|Cache Miss| DB[(Neon PostgreSQL)]
        RedirectEngine -->|2. Fast 302 Redirect| Dest([🎯 Target Destination URL])
        RedirectEngine -->|3. Async Dispatch| Worker[⚙️ Non-Blocking Click Worker]
        
        AuthGateway[🔐 Auth & RBAC Guard] -->|Verify JWT & Role| AdminAPI[👑 Admin Services]
        AuthGateway -->|Verify JWT & Ownership| LinkAPI[🔗 Link & Campaign Services]
        AdminAPI --> DB
        LinkAPI --> DB
    end

    subgraph AnalyticsPipeline [Telemetry Enrichment Pipeline]
        Worker --> Geo[🌍 GeoIP Spatial Resolver]
        Worker --> UA[📱 Device & UA Normalizer]
        Worker --> Bot[🤖 isbot Bot Detection Engine]
        Geo & UA & Bot --> Ingest[(PostgreSQL: click_events)]
    end

    subgraph ClientApp [Frontend: React 18 + Vite on Vercel]
        Marketer([👨‍💻 Marketer / User]) -->|Manage Links & View Telemetry| Dashboard[📊 LinkPulse Glassmorphic Dashboard]
        SuperAdmin([👑 Super Admin]) -->|Governance & Domain Shield| AdminPanel[🛡️ Admin Control Panel]
        Dashboard -->|REST API with Bearer JWT| AuthGateway
        AdminPanel -->|Protected Admin Routes| AuthGateway
    end
```

---

## 🔄 Data Flow Diagrams (DFD)

### 📌 DFD Level 0 (Context Diagram)

```mermaid
graph TD
    User([🌐 End User / Visitor]) -->|1. Requests Short URL| LinkPulse[⚡ LinkPulse System Gateway]
    LinkPulse -->|2. HTTP 302 Redirection| User
    
    Marketer([👨‍💼 Marketer / User]) -->|3. Authenticates, Creates Links & Sets Security| LinkPulse
    LinkPulse -->|4. Returns JWT Token, Analytics & QR Assets| Marketer
    
    Admin([👑 Super Admin]) -->|5. Moderation, Blacklist Rules, Kill-Switch| LinkPulse
    LinkPulse -->|6. Platform-Wide Oversight, User Directory & Threat Stats| Admin
    
    LinkPulse -->|7. Verified Forwarding| Destination([🎯 Destination Servers])
```

### 📌 DFD Level 1 (Detailed Functional Data Flow)

```mermaid
graph TD
    User([🌐 Visitor]) -->|Click Link| P1[1.0 Redirection Engine]
    P1 -->|Read Cache| D1[(Cache / Memory)]
    D1 -.->|Miss| D2[(PostgreSQL: links)]
    P1 -->|302 Location Header| User
    P1 -.->|Raw Event| P2[2.0 Async Telemetry Worker]
    
    P2 -->|Resolve IP| ExtGeo[MaxMind GeoIP]
    P2 -->|Parse UA| ExtBot[isbot Classifier]
    P2 -->|Store Event| D3[(PostgreSQL: click_events)]
    
    Client([👤 User / Admin]) -->|Credentials / Register| P0[0.0 Auth & RBAC Guard]
    P0 -->|Verify bcrypt / Issue JWT| D5[(PostgreSQL: users)]
    P0 -->|Authenticated User Session| P3[3.0 Link Management Wizard]
    P0 -->|Verified Admin Role| P4[4.0 Admin Governance]
    
    P3 -->|Risk Audit| ExtRisk[Security Heuristics]
    P3 -->|Check Blacklist| D4[(PostgreSQL: blocked_domains)]
    P3 -->|Save Link| D2
    
    P4 -->|Invalidate Cache| D1
    P4 -->|Update Status / Kill-Switch| D2
    P4 -->|Insert Rule| D4
    P4 -->|Read Aggregates| D3
    D3 -->|Platform Stats| Admin([👑 Admin])
```

---

## 🗄️ Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ LINKS : "creates"
    USERS ||--o{ CAMPAIGNS : "owns"
    USERS ||--o{ TAGS : "creates"
    CAMPAIGNS ||--o{ LINKS : "groups"
    LINKS ||--o{ CLICK_EVENTS : "records"
    LINKS ||--o{ LINK_TAGS : "tagged_with"
    TAGS ||--o{ LINK_TAGS : "applied_to"

    USERS {
        uuid id PK
        string email UK "unique, lowercased"
        string password_hash "bcrypt hashed (salt=10)"
        string name
        string role "user | admin (enforced RBAC)"
        timestamptz created_at
    }

    CAMPAIGNS {
        uuid id PK
        uuid user_id FK
        string name
        text description
        timestamptz created_at
    }

    LINKS {
        uuid id PK
        string short_code UK
        text destination_url
        uuid user_id FK
        uuid campaign_id FK
        string status "active | disabled"
        timestamptz expires_at
        int click_limit
        string password_hash
        timestamptz created_at
    }

    TAGS {
        uuid id PK
        uuid user_id FK
        string name
        timestamptz created_at
    }

    LINK_TAGS {
        uuid link_id PK,FK
        uuid tag_id PK,FK
    }

    CLICK_EVENTS {
        uuid id PK
        uuid link_id FK
        timestamptz clicked_at
        text referrer
        string device
        string browser
        string country
        boolean is_bot
        boolean is_blocked
        string visitor_hash
        string source "link | qr"
    }

    BLOCKED_DOMAINS {
        uuid id PK
        string domain UK
        timestamptz created_at
    }
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 18, Vite, Vanilla CSS Design System, Responsive Glassmorphism |
| **Backend API** | Node.js, Express, Helmet, CORS, Nanoid, Zod Schema Validation |
| **Database** | PostgreSQL with `pgcrypto` UUIDs, Neon Serverless Postgres |
| **Security & Auth** | JWT (JSON Web Tokens), bcrypt hashing, Rate Limiting (20 req/min) |
| **Telemetry Pipeline** | `geoip-lite`, `ua-parser-js`, `isbot`, SHA-256 Visitor Anonymization |
| **Cloud Hosting** | Vercel (Frontend SPA) + Render (API Web Service) + Neon (Cloud Postgres) |

---

## 🚀 Quick Start & Local Setup

Follow these steps to run and operate **LinkPulse** on your local machine:

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: Local instance or cloud database (e.g., [Neon](https://neon.tech) / Supabase)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/SakshamPantola/PLATFORM404-LinkPulse.git
cd PLATFORM404-LinkPulse
```

---

### 3. Backend Setup & Configuration

1. **Navigate to the server directory and install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the `server` directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Ensure the following values are configured in `server/.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linkpulse
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=platform404@gmail.com
   ADMIN_PASSWORD=Admin@123
   CLIENT_URL=http://localhost:5173
   BASE_URL=http://localhost:3001
   REDIS_URL=
   ```

3. **Run database migrations and seed default data**:
   ```bash
   npm run migrate
   npm run seed
   ```
   > 💡 *`npm run seed` creates the pre-configured Super Admin (`platform404@gmail.com` / `Admin@123`) account, sample campaigns, tags, and realistic click telemetry. New user accounts can be registered anytime directly via the web UI.*

4. **Start the backend development server**:
   ```bash
   npm run dev
   ```
   The backend API will start on `http://localhost:3001` (Health check: `http://localhost:3001/health`).

---

### 4. Frontend Setup & Launch

1. **In a separate terminal, navigate to the client directory**:
   ```bash
   cd client
   npm install
   ```

2. **Configure client environment variables**:
   Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_SHORT_BASE_URL=http://localhost:3001
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The frontend application will be running at `http://localhost:5173`.


---

### 🕹️ How to Operate the Application

1. **Access the Web App**: Open your browser and navigate to `http://localhost:5173`.
2. **Sign In**:
   - **👑 Admin Role**: Sign in with `platform404@gmail.com` / `Admin@123` to access platform-wide governance at `/admin`, universal link kill-switches, and phishing domain blacklisting.
   - **👤 Standard User**: Click **Sign Up** to register a new account (or sign in with your own credentials) to create short links, customize QR codes, and organize campaigns.
3. **Core Workflows**:
   - **Create Short Link**: Click **Create Link**, paste your target destination URL, optionally add a custom alias, password lock, or expiration date/click limit.
   - **Dynamic QR Studio**: Navigate to **QR Studio**, select any of your short links, tweak palette colors and output resolution, and download print-ready SVG or PNG assets.
   - **Real-Time Analytics**: View overall telemetry on the **Dashboard** or click into any link's detail view to inspect geo-location distribution, browser/device charts, and bot-filtered traffic counts.
   - **Admin Governance**: Switch to **Admin** to view system health, disable compromised links instantly with cache invalidation, and manage malicious domain blacklist rules.

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` — Register a new account (default role: `user`; super admin privileges strictly reserved for `platform404@gmail.com`)
- `POST /api/auth/login` — Authenticate with bcrypt verification and receive JWT
- `GET /api/auth/me` — Retrieve authenticated user profile and role

### 🔗 Link Management
- `POST /api/links` — Create short link (rate limited: 20/min/user, domain security audit)
- `GET /api/links` — List all user links with pagination and tag search
- `GET /api/links/:id` — Granular link details
- `PATCH /api/links/:id` — Update destination, click limit, or status
- `DELETE /api/links/:id` — Soft-deactivate a link

### 👑 Admin Governance (Role: admin)
- `GET /api/admin/stats` — Platform-wide overview KPIs, user count, and top domains
- `GET /api/admin/links` — Universal link inspection across all users
- `POST /api/admin/links/:id/disable` — Immediate platform-wide disable & cache purge
- `POST /api/admin/links/:id/enable` — Restore link functionality
- `GET /api/admin/users` — Directory of all registered platform users
- `GET /api/admin/blocked-domains` — List active phishing blacklist domains
- `POST /api/admin/blocked-domains` — Add domain to blocklist (subdomains auto-enforced)
- `DELETE /api/admin/blocked-domains/:id` — Remove domain from blocklist

### ⚡ Redirection & Telemetry
- `GET /:shortCode` — Sub-millisecond 302 redirect with asynchronous click recording
- `POST /:shortCode/verify` — Password verification for bcrypt-protected links

---

## 👥 Team PLATFORM404

<div align="center">

<table>
  <tr>
    <td align="center" width="20%">
      <a href="https://github.com/tiwaritushar02">
        <img src="https://github.com/tiwaritushar02.png?size=120" width="100px;" alt="Tushar Tiwari" style="border-radius: 50%;" /><br />
        <sub><b>Tushar Tiwari</b></sub>
      </a><br />
      <sub>📊 Web Assets & Telemetry</sub>
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/SarthakBhatt55">
        <img src="https://github.com/SarthakBhatt55.png?size=120" width="100px;" alt="Sarthak Bhatt" style="border-radius: 50%;" /><br />
        <sub><b>Sarthak Bhatt</b></sub>
      </a><br />
      <sub>🗄️ Database & Migrations</sub>
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/SakshamPantola">
        <img src="https://github.com/SakshamPantola.png?size=120" width="100px;" alt="Saksham Pantola" style="border-radius: 50%;" /><br />
        <sub><b>Saksham Pantola</b></sub>
      </a><br />
      <sub>🚀 Lead Full-Stack Architect</sub>
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/krish222334843">
        <img src="https://github.com/krish222334843.png?size=120" width="100px;" alt="Krishna Sijwali" style="border-radius: 50%;" /><br />
        <sub><b>Krishna Sijwali</b></sub>
      </a><br />
      <sub>🛡️ Security & Risk Scoring</sub>
    </td>
    <td align="center" width="20%">
      <a href="https://github.com/nirmaytripathi">
        <img src="https://github.com/nirmaytripathi.png?size=120" width="100px;" alt="Nirmay Tripathi" style="border-radius: 50%;" /><br />
        <sub><b>Nirmay Tripathi</b></sub>
      </a><br />
      <sub>🎨 Frontend UI & QR Studio</sub>
    </td>
  </tr>
</table>

</div>

### 📋 Member Roles & Key Contributions

| Member | Role | Key Contributions & Modules Owned | GitHub Profile |
| :--- | :--- | :--- | :--- |
| **Tushar Tiwari** | **Web Assets, Layout & Telemetry Dashboard** | • Real-time analytics dashboard layout & data visualization components<br>• Geo-location distribution breakdown (`geoip-lite`) & device charts<br>• Asset preparation, documentation visuals & responsive mobile layouts | [![GitHub](https://img.shields.io/badge/GitHub-tiwaritushar02-181717?style=flat&logo=github)](https://github.com/tiwaritushar02) |
| **Sarthak Bhatt** | **Database Engineering & PostgreSQL Migrations** | • Relational schema modeling with `pgcrypto` UUID keys<br>• Automated migration scripts & indexing strategies<br>• Redirection query optimization and connection pooling with Neon | [![GitHub](https://img.shields.io/badge/GitHub-SarthakBhatt55-181717?style=flat&logo=github)](https://github.com/SarthakBhatt55) |
| **Saksham Pantola** | **Lead Full-Stack Architect & Deployment** | • End-to-end system architecture & repository orchestration<br>• Express REST API, JWT authentication & middleware design<br>• Multi-cloud production deployment (Render API + Vercel SPA + Neon DB) | [![GitHub](https://img.shields.io/badge/GitHub-SakshamPantola-181717?style=flat&logo=github)](https://github.com/SakshamPantola) |
| **Krishna Sijwali** | **Security, URL Risk Scoring & Bot Filtering** | • Automated destination URL risk calculation & threat scoring<br>• Crawler and web-scraper filtering engine (`isbot`)<br>• Phishing defense, domain blacklisting & bcrypt password protection | [![GitHub](https://img.shields.io/badge/GitHub-krish222334843-181717?style=flat&logo=github)](https://github.com/krish222334843) |
| **Nirmay Tripathi** | **Frontend UI & Dynamic QR Studio** | • React client interface development & glassmorphic theme system<br>• Real-time Dynamic QR code studio (custom color palettes & ECC levels)<br>• Print/digital export engines (high-res SVG & PNG generation) | [![GitHub](https://img.shields.io/badge/GitHub-nirmaytripathi-181717?style=flat&logo=github)](https://github.com/nirmaytripathi) |

---

## 🔒 Security Best Practices Implemented

- **Strict Role-Based Access Control (RBAC)**: Zero privilege escalation on registration/login; distinct separation between standard user capabilities and super admin governance (`/admin`).
- **Cryptographic Password Hashing**: Passwords stored exclusively as `bcrypt` hashes (salt rounds = 10) with zero bypasses or hardcoded backdoors.
- **Rate Limiting**: Defends link generation endpoints against automated spam (20 req/min).
- **SQL Injection Prevention**: 100% parameterized queries via `pg`.
- **Strict Schema Validation**: Zod runtime schema enforcement across all incoming payloads.
- **Defensive HTTP Headers**: Armed with `helmet` for defense against clickjacking and MIME sniff attacks.
- **Privacy-First Telemetry**: IP addresses are SHA-256 hashed with rotating salts before storage to preserve GDPR privacy.

---

<div align="center">


</div>
