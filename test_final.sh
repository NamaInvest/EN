#!/bin/bash
cd /var/www/namasoft

# Login and get token
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
TOKEN=$(echo "$RESPONSE" | node -e "process.stdin.on('data',d=>{console.log(JSON.parse(d).token)})")

echo "=== USERS API ==="
curl -s http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN" | node -e "process.stdin.on('data',d=>{const u=JSON.parse(d);if(Array.isArray(u)){u.forEach(x=>console.log('User:',x.id,x.username,x.fullName,x.role))}else{console.log(JSON.stringify(u))}})"

echo ""
echo "=== SETTINGS ==="  
curl -s http://localhost:3000/api/settings -H "Authorization: Bearer $TOKEN" | node -e "process.stdin.on('data',d=>{const s=JSON.parse(d);if(Array.isArray(s)){s.forEach(x=>console.log(x.key,'=',x.value))}else{console.log(JSON.stringify(s))}})"

echo ""
echo "=== PM2 ERRORS (after fixes) ==="
pm2 flush namasoft > /dev/null 2>&1
sleep 2
curl -s http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s http://localhost:3000/api/zatca -H "Authorization: Bearer $TOKEN" > /dev/null
pm2 logs namasoft --err --lines 5 --nostream 2>/dev/null
