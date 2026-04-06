#!/bin/bash
echo "=== N3 package.json scripts ==="
grep -A 5 '"scripts"' /www/wwwroot/n3.namainvist.com/package.json
echo "=== N4 package.json scripts ==="
grep -A 5 '"scripts"' /www/wwwroot/n4.namainvist.com/package.json
echo "=== N3 PM2 script path ==="
cat /root/.pm2/dump.pm2 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(p.get('name'),p.get('script','?'),p.get('cwd','?')) for p in d.get('list',[])]"
