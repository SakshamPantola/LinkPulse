# 🔒 LinkPulse Security Compliance & OWASP Threat Audit
*Authored by Krishna Sijwali (@krish222334843)*

## 1. Defensive HTTP Headers (`helmet`)
- **Content-Security-Policy (CSP)**: Strict script boundaries restricting XSS injections.
- **X-Frame-Options: DENY**: Complete prevention of UI clickjacking attacks.
- **Strict-Transport-Security (HSTS)**: Forced SSL/TLS communication with preload directive.
- **X-Content-Type-Options: nosniff**: Defends against MIME-confusion vulnerabilities.

## 2. Password Hashing & Encryption Standards
- Sensitive short link password gates use `bcrypt` with `10` salt rounds.
- Brute-force throttling ensures max 5 failed attempts per IP address per 15-minute window.

## 3. SQL Injection Prevention
- Zero raw string concatenations in PostgreSQL queries.
- 100% parameterization using parameterized bindings (`$1`, `$2`, etc.) via `pg`.
