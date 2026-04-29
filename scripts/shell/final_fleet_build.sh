#!/bin/bash
set -e
source ~/.bashrc || true
export PATH=$PATH:/usr/local/bin:/usr/bin

# Build all from N2 to N10
for i in {2..10}; do
  DOMAIN="n${i}.namainvist.com"
  echo ">>> Building $DOMAIN natively..."
  cd /www/wwwroot/$DOMAIN
  npm install --omit=dev || true
  npm run build
  echo ">>> Build completed for $DOMAIN. Reloading PM2..."
  pm2 reload ${DOMAIN%%.*}-main || true
done
echo "ALL DOMAINS RECOVERED!"
