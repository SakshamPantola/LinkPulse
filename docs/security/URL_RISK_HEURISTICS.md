# 🛡️ LinkPulse Real-Time URL Risk Scoring Engine
*Authored by Krishna Sijwali (@krish222334843)*

## 1. Threat Model & Overview
LinkPulse evaluates every submitted destination URL prior to short link generation. The risk scoring engine assigns a normalized threat score between `0` (Safe) and `100` (Malicious).

```
Score: 0 - 20   ➔ Low Risk (Approved automatically)
Score: 21 - 50  ➔ Medium Risk (Flagged with advisory badge)
Score: 51 - 100 ➔ Critical Risk (Blocked by domain shield)
```

## 2. Threat Vector Heuristics
1. **Chained Shortener Detection**: Flags nested redirects from known shorteners (e.g. `bit.ly`, `tinyurl.com`, `t.co`) to prevent obfuscation.
2. **Suspicious TLD Scoring**: Elevated scrutiny on abuse-heavy top-level domains (`.xyz`, `.top`, `.tk`, `.ml`, `.click`).
3. **Punycode / Homograph Attacks**: Identifies Cyrillic or Unicode characters imitating legitimate financial or enterprise domains.
4. **Excessive Query String Entropy**: Detects obfuscated payloads, hex-encoded binary payloads, and credential harvesting patterns.
5. **Direct IP Addressing**: Flags bare IPv4/IPv6 destination targets lacking reverse DNS hostnames.
