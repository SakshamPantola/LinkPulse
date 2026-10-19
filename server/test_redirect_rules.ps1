# ──────────────────────────────────────────────────────────────
# test_redirect_rules.ps1
# Proves each redirect rule works in the correct order.
# Requires: curl (comes with Windows 10+), the server running
# on localhost:3001, and the database seeded (npm run seed).
# ──────────────────────────────────────────────────────────────

$BASE = "http://localhost:3001"
$EMAIL = "admin@linkpulse.test"
$PASS = "Admin@123"

Write-Host "═══ LinkPulse Redirect Engine Tests ═══" -ForegroundColor Cyan
Write-Host ""

# ── 0. Login ──────────────────────────────────────────────────
Write-Host "▸ Logging in as $EMAIL…"
$loginBody = @{ email = $EMAIL; password = $PASS } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BASE/api/auth/login" -Method POST `
  -ContentType "application/json" -Body $loginBody
$TOKEN = $login.token
Write-Host "  ✓ Got JWT token" -ForegroundColor Green
Write-Host ""

$headers = @{ Authorization = "Bearer $TOKEN" }

$pass = 0
$fail = 0

function Test-Status($label, $url, $expected, $method = "GET", $body = $null) {
    try {
        $params = @{
            Uri = $url
            Method = $method
            MaximumRedirection = 0
            ErrorAction = "Stop"
        }
        if ($method -eq "POST") {
            $params.ContentType = "application/x-www-form-urlencoded"
            $params.Body = $body
        }
        $resp = Invoke-WebRequest @params
        $status = $resp.StatusCode
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
    }
    Write-Host "  HTTP $status"
    if ($status -eq $expected) {
        Write-Host "  ✓ PASS" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  ✗ FAIL (expected $expected)" -ForegroundColor Red
        $script:fail++
    }
    Write-Host ""
}

# ── 1. Link not found → 404 ──────────────────────────────────
Write-Host "▸ Rule 1: Non-existent code → 404"
Test-Status "Rule 1" "$BASE/does-not-exist-xyz" 404

# ── Create test links ────────────────────────────────────────
Write-Host "▸ Creating test links…"

# Active link
$link1 = Invoke-RestMethod -Uri "$BASE/api/links" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://example.com"; alias = "ps-active" } | ConvertTo-Json)
Write-Host "  ✓ ps-active created" -ForegroundColor Green

# Link to disable
$link2 = Invoke-RestMethod -Uri "$BASE/api/links" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://example.com"; alias = "ps-disabled" } | ConvertTo-Json)
$link2Id = $link2.link.id
Write-Host "  ✓ ps-disabled created" -ForegroundColor Green

# Link with past expiry
$link3 = Invoke-RestMethod -Uri "$BASE/api/links" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://example.com"; alias = "ps-expired"; expires_at = "2020-01-01T00:00:00.000Z" } | ConvertTo-Json)
Write-Host "  ✓ ps-expired created (past expiry)" -ForegroundColor Green

# Link with click_limit=1
$link4 = Invoke-RestMethod -Uri "$BASE/api/links" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://example.com"; alias = "ps-limited"; click_limit = 1 } | ConvertTo-Json)
Write-Host "  ✓ ps-limited created (limit=1)" -ForegroundColor Green

# Password-protected link
$link5 = Invoke-RestMethod -Uri "$BASE/api/links" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://example.com"; alias = "ps-password"; password = "secret" } | ConvertTo-Json)
Write-Host "  ✓ ps-password created (password=secret)" -ForegroundColor Green
Write-Host ""

# ── 2. Disabled link → 410 ───────────────────────────────────
Write-Host "▸ Disabling ps-disabled…"
Invoke-RestMethod -Uri "$BASE/api/links/$link2Id" -Method DELETE -Headers $headers | Out-Null
Write-Host "  ✓ Disabled" -ForegroundColor Green

Write-Host "▸ Rule 2: Disabled link → 410"
Test-Status "Rule 2" "$BASE/ps-disabled" 410

# ── 3. Expired link → 410 ────────────────────────────────────
Write-Host "▸ Rule 3: Expired link → 410"
Test-Status "Rule 3" "$BASE/ps-expired" 410

# ── 4. Click limit reached → 410 ─────────────────────────────
Write-Host "▸ Rule 4: Click limit"
Write-Host "  First click → should redirect (302)"
Test-Status "Rule 4a" "$BASE/ps-limited" 302

# Wait for async click logging
Start-Sleep -Seconds 2

Write-Host "  Second click → should be limit reached (410)"
Test-Status "Rule 4b" "$BASE/ps-limited" 410

# ── 5. Password required → 200 (form) ────────────────────────
Write-Host "▸ Rule 5: Password-protected link"
Write-Host "  GET → should show password form (200)"
Test-Status "Rule 5a" "$BASE/ps-password" 200

Write-Host "  Wrong password → 403"
Test-Status "Rule 5b" "$BASE/ps-password/unlock" 403 "POST" "password=wrong"

Write-Host "  Correct password → 302 redirect"
Test-Status "Rule 5c" "$BASE/ps-password/unlock" 302 "POST" "password=secret"

# ── 6. Normal redirect → 302 ─────────────────────────────────
Write-Host "▸ Rule 6: Active link → 302 redirect"
Test-Status "Rule 6" "$BASE/ps-active" 302

# ── 7. Validation endpoint ───────────────────────────────────
Write-Host "▸ Validation: valid URL"
$val = Invoke-RestMethod -Uri "$BASE/api/links/validate" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://google.com" } | ConvertTo-Json)
if ($val.valid -eq $true) {
    Write-Host "  ✓ PASS — valid" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  ✗ FAIL" -ForegroundColor Red
    $fail++
}
Write-Host ""

Write-Host "▸ Validation: bad URL"
$val2 = Invoke-RestMethod -Uri "$BASE/api/links/validate" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "ftp://bad" } | ConvertTo-Json)
if ($val2.valid -eq $false) {
    Write-Host "  ✓ PASS — invalid detected" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  ✗ FAIL" -ForegroundColor Red
    $fail++
}
Write-Host ""

Write-Host "▸ Validation: reserved alias"
$val3 = Invoke-RestMethod -Uri "$BASE/api/links/validate" -Method POST `
  -ContentType "application/json" -Headers $headers `
  -Body (@{ destination_url = "https://google.com"; alias = "admin" } | ConvertTo-Json)
if ($val3.valid -eq $false) {
    Write-Host "  ✓ PASS — reserved word detected" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  ✗ FAIL" -ForegroundColor Red
    $fail++
}
Write-Host ""

Write-Host "▸ Dashboard stats API"
$stats = Invoke-RestMethod -Uri "$BASE/api/stats/dashboard" -Method GET -Headers $headers
if ($stats.stats.totalLinks -gt 0) {
    Write-Host "  ✓ PASS — totalLinks=$($stats.stats.totalLinks)" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  ✗ FAIL" -ForegroundColor Red
    $fail++
}
Write-Host ""

# ── Summary ──────────────────────────────────────────────────
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
