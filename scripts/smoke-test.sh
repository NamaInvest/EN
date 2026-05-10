#!/bin/bash
# ============================================================
# Nama Invest — Smoke Tests
# ============================================================
# يُشغَّل بعد كل deploy للتأكد من أن الـ app يعمل.
# إذا فشل أي test → يعود الـ CI بـ exit 1 → rollback.
#
# الاستخدام:
#   ./scripts/smoke-test.sh https://namainvist.com
#   ./scripts/smoke-test.sh http://localhost:3000
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10
PASSED=0
FAILED=0

log()    { echo "[$(date '+%H:%M:%S')] $*"; }
pass()   { log "✅ PASS: $*"; PASSED=$((PASSED+1)); }
fail()   { log "❌ FAIL: $*"; FAILED=$((FAILED+1)); }

# ── Helper ────────────────────────────────────────────────────────────────────
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local expected_body="${4:-}"

    local response
    local http_code
    http_code=$(curl -s -o /tmp/smoke_body -w "%{http_code}" \
        --max-time "$TIMEOUT" \
        -H "Accept: application/json" \
        "$url" 2>/dev/null || echo "000")

    if [ "$http_code" = "$expected_status" ]; then
        if [ -n "$expected_body" ]; then
            if grep -q "$expected_body" /tmp/smoke_body 2>/dev/null; then
                pass "$name (HTTP $http_code, body contains '$expected_body')"
            else
                fail "$name (HTTP $http_code, body missing '$expected_body')"
                cat /tmp/smoke_body 2>/dev/null | head -3
            fi
        else
            pass "$name (HTTP $http_code)"
        fi
    else
        fail "$name (expected $expected_status, got $http_code)"
        cat /tmp/smoke_body 2>/dev/null | head -3
    fi
}

check_not_exposed() {
    local name="$1"
    local url="$2"
    local forbidden_status="${3:-200}"

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

    if [ "$http_code" != "$forbidden_status" ]; then
        pass "$name (correctly returns HTTP $http_code, not $forbidden_status)"
    else
        fail "$name (EXPOSED! Returns HTTP $http_code)"
    fi
}

# ── Tests ─────────────────────────────────────────────────────────────────────
log "======================================"
log "🚀 Smoke Tests: $BASE_URL"
log "======================================"

# 1. Health check — الأهم
check_endpoint "Health API"              "$BASE_URL/api/health"          "200" "healthy"

# 2. Core public pages
check_endpoint "Login page"             "$BASE_URL/login"               "200"
check_endpoint "Root redirect"          "$BASE_URL/"                    "200"

# 3. API endpoints يجب أن ترجع 401 لغير المصرح لهم
check_endpoint "Auth required — sales"  "$BASE_URL/api/sales"           "401"
check_endpoint "Auth required — users"  "$BASE_URL/api/users"           "401"
check_endpoint "Auth required — hr"     "$BASE_URL/api/hr"              "401"

# 4. Cron routes يجب أن ترجع 401 (لا 200 بلا auth)
check_endpoint "Cron debts guarded"     "$BASE_URL/api/cron/debts"      "401"
check_endpoint "Cron hr guarded"        "$BASE_URL/api/cron/hr"         "401"
check_endpoint "Cron shifts guarded"    "$BASE_URL/api/cron/shifts"     "401"

# 5. Disabled/gone endpoints
check_endpoint "system/reset disabled"  "$BASE_URL/api/system/reset"    "410"
check_endpoint "check-env disabled"     "$BASE_URL/api/check-env"       "410"

# 6. Non-existent endpoints
check_endpoint "404 for random path"    "$BASE_URL/api/nonexistent-xyz" "404"

# ── Result ────────────────────────────────────────────────────────────────────
log "======================================"
log "Results: $PASSED passed, $FAILED failed"
log "======================================"

if [ "$FAILED" -gt 0 ]; then
    log "❌ SMOKE TESTS FAILED — Deploy should be rolled back"
    exit 1
else
    log "✅ All smoke tests passed — Deploy is healthy"
    exit 0
fi
