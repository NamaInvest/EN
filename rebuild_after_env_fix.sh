#!/bin/bash
# Rebuild all broken nodes AFTER .env is already fixed
NODE=/usr/bin/node

for i in 2 4 5 6 7 8 9 10; do
  domain="n${i}.namainvist.com"
  dir="/www/wwwroot/${domain}"
  echo ""
  echo "=== Rebuilding $domain ==="
  
  # Wipe old .next
  rm -rf "$dir/.next"
  
  # Build with correct env in place
  cd "$dir"
  $NODE ./node_modules/.bin/next build >> /root/rebuild.log 2>&1
  
  if [ $? -eq 0 ]; then
    echo "$domain BUILD SUCCESS"
  else
    echo "$domain BUILD FAILED - check /root/rebuild.log"
  fi
  
  pm2 restart "n${i}-main" --update-env
done

pm2 save
echo ""
echo "=== ALL REBUILDS COMPLETE ==="
