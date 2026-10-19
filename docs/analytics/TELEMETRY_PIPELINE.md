# 📊 LinkPulse Telemetry & Real-Time Ingestion Pipeline
*Authored by Tushar Tiwari (@tiwaritushar02)*

## 1. Overview
The LinkPulse telemetry pipeline captures, enriches, and records redirection events with sub-millisecond overhead. Every incoming click passes through our non-blocking ingestion worker before persisting to the PostgreSQL time-series store.

## 2. Event Lifecycle
```
[User Redirection Request]
        │
        ├──► Fast 302 Redirection (Zero Latency Penalty)
        │
        └──► Async Telemetry Dispatch
                  │
                  ├──► 1. Bot & Crawler Detection (isbot engine)
                  ├──► 2. SHA-256 Visitor IP Anonymization
                  ├──► 3. GeoIP Spatial Resolution (Country / City)
                  ├──► 4. User-Agent Fingerprint Normalization
                  └──► 5. Asynchronous PostgreSQL Ingestion
```

## 3. Telemetry Attributes Captured
- **Timestamp**: High-precision UTC timestamp (`clicked_at`).
- **Short Link Reference**: Foreign key mapping to parent short link entity.
- **Geographical Spatial Data**: Country ISO code, Region, City name.
- **Client Classification**: Device family (Mobile, Desktop, Tablet), Operating System, Browser engine.
- **Referrer Categorization**: Direct, Organic Search, Social Media, or Custom UTM Source.
- **Security Audit Tag**: Bot classification status and risk score threshold.

## 4. Privacy & GDPR Compliance
IP addresses are strictly anonymized using SHA-256 hashing combined with rotating daily cryptographic salts. Raw client IP addresses are never persisted to long-term storage.
