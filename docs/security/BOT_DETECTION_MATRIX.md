# 🤖 LinkPulse Bot Detection & Crawler Filtration Matrix
*Authored by Krishna Sijwali (@krish222334843)*

## 1. Objective
Automated crawlers and social link scrapers artificially inflate redirection click counts. The bot detection subsystem isolates and tags automated agents using regex heuristics and known signature catalogues (`isbot`).

## 2. Classification Hierarchy
| Agent Category | Signature Examples | Telemetry Action |
| :--- | :--- | :--- |
| **Search Engine Spiders** | `Googlebot`, `Bingbot`, `DuckDuckBot` | Log with `is_bot: true`, bypass metrics |
| **Social Media Previewers** | `Twitterbot`, `facebookexternalhit`, `Slackbot` | Allow 200 preview, omit from dashboard |
| **Security & Vulnerability Scanners** | `Nikto`, `sqlmap`, `Qualys`, `curl` | Intercept with defensive 403 / 429 gate |
| **Verified Human Users** | Chrome, Safari, Firefox, Edge, Mobile WebViews | Full telemetry ingestion & attribution |

## 3. Passive Fingerprint Checks
- Verification of standard `Accept`, `Accept-Language`, and `Sec-CH-UA` HTTP request headers.
- Detection of headless automation drivers (`Puppeteer`, `Playwright`, `Selenium WebDriver`).
