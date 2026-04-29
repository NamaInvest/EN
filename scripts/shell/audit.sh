#!/bin/bash
cd /var/www/namasoft

echo "========================================="
echo "    COMPREHENSIVE SITE AUDIT"
echo "========================================="

# Login
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
TOKEN=$(echo "$RESPONSE" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).token)}catch(e){console.log('FAIL')}})")

if [ "$TOKEN" = "FAIL" ] || [ -z "$TOKEN" ]; then
  echo "❌ LOGIN FAILED - Cannot proceed"
  exit 1
fi
echo "✅ Login OK"

# Test function
test_api() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "✅ $name (HTTP $code)"
  else
    echo "❌ $name (HTTP $code)"
  fi
}

echo ""
echo "=== 1. API ENDPOINTS ==="
test_api "GET /api/users" "http://localhost:3000/api/users"
test_api "GET /api/products" "http://localhost:3000/api/products"
test_api "GET /api/categories" "http://localhost:3000/api/categories"
test_api "GET /api/customers" "http://localhost:3000/api/customers"
test_api "GET /api/sales" "http://localhost:3000/api/sales"
test_api "GET /api/purchases" "http://localhost:3000/api/purchases"
test_api "GET /api/expenses" "http://localhost:3000/api/expenses"
test_api "GET /api/treasury" "http://localhost:3000/api/treasury"
test_api "GET /api/treasury/balance" "http://localhost:3000/api/treasury/balance"
test_api "GET /api/settings" "http://localhost:3000/api/settings"
test_api "GET /api/dashboard" "http://localhost:3000/api/dashboard"
test_api "GET /api/employees" "http://localhost:3000/api/employees"
test_api "GET /api/attendance" "http://localhost:3000/api/attendance"
test_api "GET /api/salaries" "http://localhost:3000/api/salaries"
test_api "GET /api/vacations" "http://localhost:3000/api/vacations"
test_api "GET /api/promotions" "http://localhost:3000/api/promotions"
test_api "GET /api/installments" "http://localhost:3000/api/installments"
test_api "GET /api/maintenance" "http://localhost:3000/api/maintenance"
test_api "GET /api/bookings" "http://localhost:3000/api/bookings"
test_api "GET /api/price-quotes" "http://localhost:3000/api/price-quotes"
test_api "GET /api/purchase-orders" "http://localhost:3000/api/purchase-orders"
test_api "GET /api/sales-returns" "http://localhost:3000/api/sales-returns"
test_api "GET /api/purchase-returns" "http://localhost:3000/api/purchase-returns"
test_api "GET /api/stock-movements" "http://localhost:3000/api/stock-movements"
test_api "GET /api/stock-transfers" "http://localhost:3000/api/stock-transfers"
test_api "GET /api/stocktake" "http://localhost:3000/api/stocktake"
test_api "GET /api/accounting/accounts" "http://localhost:3000/api/accounting/accounts"
test_api "GET /api/accounting/journal" "http://localhost:3000/api/accounting/journal"
test_api "GET /api/accounting/trial-balance" "http://localhost:3000/api/accounting/trial-balance"
test_api "GET /api/accounting/balance-sheet" "http://localhost:3000/api/accounting/balance-sheet"
test_api "GET /api/accounting/income-statement" "http://localhost:3000/api/accounting/income-statement"
test_api "GET /api/accounting/ledger" "http://localhost:3000/api/accounting/ledger"
test_api "GET /api/zatca" "http://localhost:3000/api/zatca"
test_api "GET /api/zatca/qr" "http://localhost:3000/api/zatca/qr"
test_api "GET /api/auth/session" "http://localhost:3000/api/auth/session"
test_api "GET /api/reports/sales" "http://localhost:3000/api/reports/sales"

echo ""
echo "=== 2. PAGE LOADING ==="
test_page() {
  local name="$1"
  local url="$2"
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --cookie "token=$TOKEN")
  if [ "$code" = "200" ]; then
    echo "✅ $name"
  else
    echo "❌ $name (HTTP $code)"
  fi
}

test_page "Login" "http://localhost:3000/login"
test_page "Dashboard" "http://localhost:3000/dashboard"
test_page "Products" "http://localhost:3000/products"
test_page "Sales" "http://localhost:3000/sales"
test_page "Purchases" "http://localhost:3000/purchases"
test_page "Customers" "http://localhost:3000/customers"
test_page "Expenses" "http://localhost:3000/expenses"
test_page "Treasury" "http://localhost:3000/treasury"
test_page "Stock" "http://localhost:3000/stock"
test_page "Settings" "http://localhost:3000/settings"
test_page "Employees" "http://localhost:3000/employees"
test_page "Reports" "http://localhost:3000/reports"
test_page "Accounting" "http://localhost:3000/accounting"
test_page "Barcode" "http://localhost:3000/barcode"
test_page "Sales Returns" "http://localhost:3000/sales-returns"
test_page "Purchase Returns" "http://localhost:3000/purchase-returns"
test_page "Promotions" "http://localhost:3000/promotions"
test_page "Vacations" "http://localhost:3000/vacations"
test_page "Attendance" "http://localhost:3000/attendance"
test_page "Salaries" "http://localhost:3000/salaries"
test_page "Maintenance" "http://localhost:3000/maintenance"
test_page "Bookings" "http://localhost:3000/bookings"
test_page "Installments" "http://localhost:3000/installments"
test_page "Price Quotes" "http://localhost:3000/price-quotes"
test_page "Purchase Orders" "http://localhost:3000/purchase-orders"
test_page "Stock Transfers" "http://localhost:3000/stock-transfers"
test_page "Stocktake" "http://localhost:3000/stocktake"

echo ""
echo "=== 3. DATABASE SCHEMA COMPARISON ==="
echo "--- Tables on NEW server ---"
sudo -u postgres psql -d namadb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | tr -d ' '

echo ""
echo "=== 4. SCHEMA COLUMNS CHECK ==="
echo "--- users table ---"
sudo -u postgres psql -d namadb -c "\d users" 2>/dev/null | grep -E "Column|------|^\s+\w"
echo "--- products table ---"
sudo -u postgres psql -d namadb -c "\d products" 2>/dev/null | grep -E "Column|------|^\s+\w"

echo ""
echo "=== 5. ENVIRONMENT ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" used ("$5")"}')"
echo "RAM: $(free -m | grep Mem | awk '{print $3"MB/"$2"MB used"}')"
echo "Swap: $(free -m | grep Swap | awk '{print $3"MB/"$2"MB used"}')"

echo ""
echo "=== 6. SECURITY ==="
echo "--- Open Ports ---"
ss -tlnp | grep LISTEN | awk '{print $4}' | sort
echo "--- .env exposed? ---"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/.env
echo "  (should be 404)"

echo ""
echo "=== 7. PM2 ERRORS (last 10) ==="
pm2 logs namasoft --err --lines 10 --nostream 2>/dev/null

echo ""
echo "=== 8. LOGO/UPLOAD DIRECTORY ==="
ls -la /var/www/namasoft/public/uploads/ 2>/dev/null || echo "No uploads directory"

echo ""
echo "========================================="
echo "    AUDIT COMPLETE"
echo "========================================="
