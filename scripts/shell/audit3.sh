#!/bin/bash
cd /var/www/namasoft

echo "=== DATABASE TABLES ==="
sudo -u postgres psql -d namadb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | tr -d ' ' | grep -v '^$'

echo ""
echo "=== ENVIRONMENT ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" used ("$5")"}')"
echo "RAM: $(free -m | grep Mem | awk '{print $3"MB/"$2"MB used"}')"

echo ""
echo "=== SECURITY ==="
ss -tlnp | grep LISTEN | awk '{print $4}' | sort

echo ""
echo "=== PM2 STATUS ==="
pm2 info namasoft 2>/dev/null | grep -E 'status|restarts|uptime'
echo "---namasoft2---"
pm2 info namasoft2 2>/dev/null | grep -E 'status|restarts|uptime'

echo ""
echo "=== NGINX ==="
nginx -t 2>&1
systemctl is-active nginx

echo "=== DONE ==="
