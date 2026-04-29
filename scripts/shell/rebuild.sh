#!/bin/bash
echo "=== REBUILDING TO FIX SERVER ACTION ERRORS ==="
cd /var/www/namasoft

echo "--- Rebuilding namasoft ---"
npm run build 2>&1 | tail -5
pm2 restart namasoft
echo "namasoft rebuilt and restarted"

if [ -d "/var/www/namasoft2" ]; then
  echo ""
  echo "--- Rebuilding namasoft2 ---"
  cd /var/www/namasoft2
  npm run build 2>&1 | tail -5
  pm2 restart namasoft2
  echo "namasoft2 rebuilt and restarted"
fi

if [ -d "/var/www/namasoft3" ]; then
  echo ""
  echo "--- Rebuilding namasoft3 ---"
  cd /var/www/namasoft3
  npm run build 2>&1 | tail -5
  pm2 restart namasoft3
  echo "namasoft3 rebuilt and restarted"
fi

echo ""
echo "=== PM2 STATUS ==="
pm2 list

echo ""
echo "=== REBUILD COMPLETE ==="
