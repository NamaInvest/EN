#!/bin/bash
echo "=== FIXING PERMISSIONS FOR namasoft ==="
sudo -u postgres psql -d namadb -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO namasoft;"
sudo -u postgres psql -d namadb -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO namasoft;"
sudo -u postgres psql -d namadb -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO namasoft;"
sudo -u postgres psql -d namadb -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO namasoft;"

echo ""
echo "=== RESTARTING PM2 ==="
pm2 restart namasoft
sleep 5

echo ""
echo "=== VERIFYING ZATCA API ==="
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
TOKEN=$(echo "$RESPONSE" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).token)}catch(e){console.log('FAIL')}})")
ZATCA_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/zatca -H "Authorization: Bearer $TOKEN")
echo "ZATCA API after fix: HTTP $ZATCA_CODE"

echo ""
echo "=== PM2 STATUS AFTER RESTART ==="
pm2 info namasoft 2>/dev/null | grep -E 'status|restarts|uptime'

echo "=== DONE ==="
