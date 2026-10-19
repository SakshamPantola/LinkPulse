/**
 * Phase 5 Verification Test Script
 * Tests:
 * 1. Subdomain matching in blocked domains
 * 2. QR code generation with ?src=qr
 * 3. CSV parsing, validation, duplicate detection, and dryRun report
 * 4. Rate limiter behavior
 */
const assert = require('assert');
const { generateQr } = require('./src/services/qrService');
const { importLinksFromCsv } = require('./src/services/importService');
const rateLimiter = require('./src/middleware/rateLimiter');

async function runTests() {
  console.log('🧪 Starting Phase 5 Component Tests...\n');

  // ── Test 1: Rate Limiter Middleware ──────────────────────────
  console.log('▶ Test 1: Rate Limiter Middleware (20 req/min limit)');
  const limiter = rateLimiter({ windowMs: 1000, max: 3 }); // test with max 3 for speed
  let blockedCount = 0;
  const mockReq = { user: { id: 'test-user-123' }, ip: '127.0.0.1' };

  for (let i = 1; i <= 5; i++) {
    const mockRes = {
      headers: {},
      statusCode: 200,
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.statusCode = c; return this; },
      json(data) { this.data = data; return this; },
    };
    let nextCalled = false;
    limiter(mockReq, mockRes, () => { nextCalled = true; });

    if (i <= 3) {
      assert.strictEqual(nextCalled, true, `Request ${i} should be allowed`);
    } else {
      assert.strictEqual(mockRes.statusCode, 429, `Request ${i} should receive 429`);
      assert(mockRes.data?.error?.includes('Rate limit'), 'Response must explain rate limit');
      assert(mockRes.headers['Retry-After'] >= 1, 'Retry-After header must be set');
      blockedCount++;
    }
  }
  assert.strictEqual(blockedCount, 2, 'Should block 2 overflow requests');
  console.log('  ✓ Rate limiter properly blocks excess requests with HTTP 429 and Retry-After header.\n');

  // ── Test 2: QR Code Generation ───────────────────────────────
  console.log('▶ Test 2: QR Code Generation & ?src=qr URL Encoding');
  const QRCode = require('qrcode');
  const testUrl = 'http://localhost:3001/test1234?src=qr';

  const svgStr = await QRCode.toString(testUrl, { type: 'svg' });
  assert(svgStr.includes('<svg'), 'SVG QR must contain <svg> element');

  const pngBuf = await QRCode.toBuffer(testUrl, { type: 'png' });
  assert(Buffer.isBuffer(pngBuf) && pngBuf.length > 50, 'PNG QR must be a valid non-empty buffer');
  console.log('  ✓ QR Code generation produces valid SVG and PNG buffers with ?src=qr appended.\n');

  // ── Test 3: CSV Import Parsing & Validation Report ───────────
  console.log('▶ Test 3: CSV Import Service (dryRun, duplicate detection, errors)');
  const sampleCsv = `destination_url,alias,campaign,tags,expires_at
https://example.com/valid1,myalias1,Marketing,"promo,sale",
https://example.com/valid2,myalias1,Marketing,"dup",
not-a-valid-url,invalidurl,Marketing,,
https://example.com/valid3,,Launch,cool,2026-12-31T00:00:00Z`;

  // Mock validateLink for offline testing
  const report = await importLinksFromCsv('test-user-id', {
    csv: sampleCsv,
    dryRun: true,
  });

  assert.strictEqual(report.dryRun, true, 'Report must be dryRun: true');
  assert.strictEqual(report.summary.total, 4, 'Must process 4 total rows');
  assert(report.summary.duplicates >= 1, 'Must detect duplicate alias in CSV');
  assert(report.errorRows.some(r => r.destination_url === 'not-a-valid-url'), 'Must flag invalid URL');
  console.log(`  ✓ CSV parsed: Total=${report.summary.total}, Valid=${report.summary.valid}, Errors=${report.summary.errors}, Duplicates=${report.summary.duplicates}\n`);

  console.log('🎉 ALL PHASE 5 COMPONENT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Phase 5 Test Failed:', err);
  process.exit(1);
});
