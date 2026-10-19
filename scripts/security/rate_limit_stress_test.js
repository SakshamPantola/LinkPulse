/**
 * Rate Limiter Emulation & Stress Test Script
 * Authored by Krishna Sijwali (@krish222334843)
 */

function simulateRateLimiter(maxRequests = 100, windowMs = 60000) {
  const ipBuckets = new Map();

  return function checkRequest(ip) {
    const now = Date.now();
    const bucket = ipBuckets.get(ip) || [];
    const validTimestamps = bucket.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((windowMs - (now - validTimestamps[0])) / 1000) };
    }

    validTimestamps.push(now);
    ipBuckets.set(ip, validTimestamps);
    return { allowed: true, remaining: maxRequests - validTimestamps.length };
  };
}

function runRateLimitStressTest() {
  console.log('⚡ Running In-Memory Rate Limiter Stress Simulation...');
  const limiter = simulateRateLimiter(10, 1000); // 10 reqs per second
  const testIp = '198.51.100.42';

  let blockedCount = 0;
  for (let i = 1; i <= 15; i++) {
    const res = limiter(testIp);
    if (!res.allowed) {
      blockedCount++;
      console.log(`[Request #${i}] 429 BLOCKED: Rate limit exceeded (Retry in ${res.retryAfter}s)`);
    } else {
      console.log(`[Request #${i}] 200 OK: Allowed (${res.remaining} remaining)`);
    }
  }

  console.log(`\n🛡️ Rate limiter successfully intercepted ${blockedCount} burst requests.`);
}

if (require.main === module) {
  runRateLimitStressTest();
}

module.exports = { simulateRateLimiter, runRateLimitStressTest };
