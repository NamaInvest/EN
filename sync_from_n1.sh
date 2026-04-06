#!/bin/bash
set +e

# Make sure we use the right Node version
source ~/.bashrc || true
export PATH=$PATH:/usr/local/bin:/usr/bin

echo "=================================================="
echo "Starting N1 Mirroring to N2-N10..."
echo "=================================================="

for i in {2..10}; do
  DOMAIN="n${i}.namainvist.com"
  DEST="/www/wwwroot/$DOMAIN"
  
  echo ">>> Recovering $DOMAIN from N1..."
  
  # Rsync exact perfect state from N1 to N2-N10 (excluding env and logs)
  rsync -avq --delete --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='logs' --exclude='.user.ini' "/www/wwwroot/n1.namainvist.com/" "$DEST/"
  
  echo ">>> Building $DOMAIN natively..."
  cd "$DEST"
  npm install --omit=dev > /dev/null 2>&1
  npm run build > /dev/null 2>&1
  
  echo ">>> Reloading PM2 for $DOMAIN..."
  pm2 reload ${DOMAIN%%.*}-main > /dev/null 2>&1
done

echo "ALL DOMAINS RECOVERED FROM N1!"
