#!/bin/bash
echo "=== FIXING SERVER ISSUES ==="

# 1. Block direct app ports
echo "--- Configuring Firewall ---"
ufw allow 22
ufw allow 80
ufw allow 443
ufw deny 3000
ufw deny 3001
ufw deny 3002
ufw deny 3003
echo "y" | ufw enable
ufw status | grep -E "3000|3001|3002|3003|Status"

# 2. Create uploads directory
echo ""
echo "--- Creating Uploads Directory ---"
mkdir -p /var/www/namasoft/public/uploads
chmod 755 /var/www/namasoft/public/uploads
ls -la /var/www/namasoft/public/uploads/
if [ -d "/var/www/namasoft2" ]; then
  mkdir -p /var/www/namasoft2/public/uploads
  chmod 755 /var/www/namasoft2/public/uploads
  echo "Created uploads for namasoft2 too"
fi

echo ""
echo "=== DONE ==="
