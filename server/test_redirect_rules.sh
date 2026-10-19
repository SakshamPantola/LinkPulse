#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# test_redirect_rules.sh
# Proves each redirect rule works in order.
# Requires: curl, jq, a running server on localhost:3001, and
# the database seeded (npm run seed).
# ──────────────────────────────────────────────────────────────
set -euo pipefail

BASE="http://localhost:3001"
EMAIL="admin@linkpulse.test"
PASS="Admin@123"

echo "═══ LinkPulse Redirect Engine Tests ═══"
echo ""

# ── 0. Login ──────────────────────────────────────────────────
echo "▸ Logging in as $EMAIL…"
LOGIN=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo "$LOGIN" | jq -r '.token')
echo "  ✓ Got JWT token"
echo ""

AUTH="Authorization: Bearer $TOKEN"

# ── 1. Link not found → 404 ──────────────────────────────────
echo "▸ Rule 1: Non-existent code → 404"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/does-not-exist")
echo "  HTTP $STATUS"
[ "$STATUS" = "404" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"
echo ""

# ── Create test links ────────────────────────────────────────
echo "▸ Creating test links…"

# Active link
LINK1=$(curl -sf -X POST "$BASE/api/links" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"destination_url":"https://example.com","alias":"test-active"}')
echo "  ✓ test-active created"

# Link to disable
LINK2=$(curl -sf -X POST "$BASE/api/links" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"destination_url":"https://example.com","alias":"test-disabled"}')
LINK2_ID=$(echo "$LINK2" | jq -r '.link.id')

# Link with past expiry
LINK3=$(curl -sf -X POST "$BASE/api/links" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"destination_url":"https://example.com","alias":"test-expired","expires_at":"2020-01-01T00:00:00.000Z"}')
echo "  ✓ test-expired created (past expiry)"

# Link with click_limit=1
LINK4=$(curl -sf -X POST "$BASE/api/links" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"destination_url":"https://example.com","alias":"test-limited","click_limit":1}')
echo "  ✓ test-limited created (limit=1)"

# Password-protected link
LINK5=$(curl -sf -X POST "$BASE/api/links" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"destination_url":"https://example.com","alias":"test-password","password":"secret"}')
echo "  ✓ test-password created (password=secret)"
echo ""

# ── 2. Disabled link → 410 ───────────────────────────────────
echo "▸ Disabling test-disabled…"
curl -sf -X DELETE "$BASE/api/links/$LINK2_ID" -H "$AUTH" > /dev/null
echo "  ✓ Disabled"

echo "▸ Rule 2: Disabled link → 410"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/test-disabled")
echo "  HTTP $STATUS"
[ "$STATUS" = "410" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"
echo ""

# ── 3. Expired link → 410 ────────────────────────────────────
echo "▸ Rule 3: Expired link → 410"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/test-expired")
echo "  HTTP $STATUS"
[ "$STATUS" = "410" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"
echo ""

# ── 4. Click limit reached → 410 ─────────────────────────────
echo "▸ Rule 4: Click limit"
echo "  First click → should redirect (302)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE/test-limited" 2>/dev/null || true)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/test-limited")
echo "  HTTP $STATUS (first click)"

# Wait a moment for async click logging
sleep 1

echo "  Second click → should be limit reached (410)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/test-limited")
echo "  HTTP $STATUS"
[ "$STATUS" = "410" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"
echo ""

# ── 5. Password required → 200 (form) ────────────────────────
echo "▸ Rule 5: Password-protected link"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/test-password")
echo "  GET → HTTP $STATUS (password form)"
[ "$STATUS" = "200" ] && echo "  ✓ PASS — form shown" || echo "  ✗ FAIL"

echo "  Wrong password → 403"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/test-password/unlock" \
  -d "password=wrong")
echo "  HTTP $STATUS"
[ "$STATUS" = "403" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"

echo "  Correct password → 302 redirect"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/test-password/unlock" \
  -d "password=secret")
echo "  HTTP $STATUS"
[ "$STATUS" = "302" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"
echo ""

# ── 6. Normal redirect → 302 ─────────────────────────────────
echo "▸ Rule 6: Active link → 302 redirect"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/test-active")
echo "  HTTP $STATUS"
[ "$STATUS" = "302" ] && echo "  ✓ PASS" || echo "  ✗ FAIL"

LOCATION=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE/test-active")
echo "  Location: $LOCATION"
echo ""

echo "═══ All redirect rule tests complete ═══"
