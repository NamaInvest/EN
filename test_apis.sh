#!/bin/bash
cd /var/www/namasoft

echo "=== TEST LOGIN API ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "BODY: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
  TOKEN=$(echo "$BODY" | node -e "process.stdin.on('data',d=>{console.log(JSON.parse(d).token)})")
  echo ""
  echo "=== TEST USERS API ==="
  curl -s http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN" | head -c 500
  echo ""
  echo ""
  echo "=== TEST SETTINGS API ==="
  curl -s http://localhost:3000/api/settings -H "Authorization: Bearer $TOKEN" | head -c 300
  echo ""
  echo ""
  echo "=== TEST PRODUCTS API ==="
  curl -s http://localhost:3000/api/products -H "Authorization: Bearer $TOKEN" | head -c 200
  echo ""
  echo ""
  echo "=== TEST DASHBOARD API ==="
  curl -s http://localhost:3000/api/dashboard -H "Authorization: Bearer $TOKEN" | head -c 300
  echo ""
fi

echo ""
echo "=== PM2 ERROR LOGS ==="
pm2 logs namasoft --err --lines 20 --nostream 2>/dev/null
