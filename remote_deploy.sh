#!/bin/bash
cd /var/www/namasoft || exit 1
apt-get update
apt-get install -y unzip
unzip -q -o src.zip
rm -f src.zip
npx prisma db push --schema=prisma/schema.prisma
npx prisma generate
rm -f /tmp/build_sync.log
nohup bash -c "npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft" > /dev/null 2>&1 &
echo "[3/3] Background Build successfully triggered on 95.217.187.44!"
