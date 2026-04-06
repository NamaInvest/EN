#!/bin/bash
set -e

for i in {3..10}; do
  echo "Syncing N2 to N${i}..."
  rsync -a --exclude 'node_modules' --exclude '.next' "/www/wwwroot/n2.namainvist.com/src/" "/www/wwwroot/n${i}.namainvist.com/src/"
done

for i in {2..10}; do
  DOMAIN="n${i}.namainvist.com"
  PORT=$((3000 + i))
  echo "Building $DOMAIN..."
  fuser -k -9 ${PORT}/tcp || true
  cd /www/wwwroot/$DOMAIN
  npm run build
done

echo "Reloading PM2 globally..."
pm2 reload all
echo "ALL DONE"
