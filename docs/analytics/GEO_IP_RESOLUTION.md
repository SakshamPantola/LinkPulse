# 🌍 GeoIP Spatial Resolution & Privacy Guardrails
*Authored by Tushar Tiwari (@tiwaritushar02)*

## 1. Resolution Mechanism
LinkPulse resolves client incoming IP addresses to spatial locations using local MaxMind MMDB lookup tables via `geoip-lite`. This approach ensures:
- **Zero Third-Party API Latency**: Lookups execute in memory without calling external slow REST APIs.
- **Privacy Assurance**: The IP lookup occurs within the server's local RAM buffer and is discarded immediately after extracting the ISO country code and city name.

## 2. Supported Geographic Properties
```typescript
interface GeoResolution {
  country: string;     // 2-letter ISO 3166-1 alpha-2 code (e.g. 'US', 'IN', 'GB')
  region: string;      // Two-character region or state code
  city: string;        // Human-readable city identifier
  timezone: string;    // Standard IANA timezone identifier
}
```

## 3. Fallback Handling
When requests arrive from `localhost`, private subnets (`10.0.0.0/8`, `192.168.0.0/16`), or anonymized proxies, the engine gracefully tags the record with `'UNKNOWN'` without interrupting or rejecting the 302 redirect.
