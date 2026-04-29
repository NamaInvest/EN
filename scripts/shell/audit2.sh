#!/bin/bash
cd /var/www/namasoft

RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
TOKEN=$(echo "$RESPONSE" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).token)}catch(e){console.log('FAIL')}})")

test_page() {
  local name="$1"
  local url="$2"
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --cookie "token=$TOKEN")
  if [ "$code" = "200" ]; then
    echo "OK $name"
  else
    echo "FAIL $name (HTTP $code)"
  fi
}

echo "=== PAGES (continued) ==="
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
echo "=== 3. DATABASE TABLES ==="
sudo -u postgres psql -d namadb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | tr -d ' ' | grep -v '^$'

echo ""
echo "=== 4. KEY TABLE SCHEMAS ==="
echo "--- users table ---"
sudo -u postgres psql -d namadb -c "\d users" 2>/dev/null | head -40
echo "--- products table ---"
sudo -u postgres psql -d namadb -c "\d products" 2>/dev/null | head -40

echo ""
echo "=== 5. ENVIRONMENT ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" used ("$5")"}')"
echo "RAM: $(free -m | grep Mem | awk '{print $3"MB/"$2"MB used"}')"

echo ""
echo "=== 6. SECURITY ==="
echo "--- Open Ports ---"
ss -tlnp | grep LISTEN | awk '{print $4}' | sort
echo "--- .env exposed? ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/.env)
echo "$CODE (should be 404)"

echo ""
echo "=== 7. PM2 STATUS ==="
pm2 list 2>/dev/null
pm2 logs namasoft --err --lines 10 --nostream 2>/dev/null || echo "No pm2 error logs"

echo ""
echo "=== 8. UPLOADS ==="
ls -la /var/www/namasoft/public/uploads/ 2>/dev/null || echo "No uploads directory"

echo ""
echo "=== AUDIT COMPLETE ==="
