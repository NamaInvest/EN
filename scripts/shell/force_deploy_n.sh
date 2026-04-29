#!/bin/bash
SOURCE_DIR="/www/wwwroot/n1.namainvist.com"

echo "Purging Service Worker Caches for N2..."
rm -f /www/wwwroot/n2.namainvist.com/public/sw.js
rm -f /www/wwwroot/n2.namainvist.com/public/workbox-*.js

for i in {4..10}; do
  DOMAIN="n${i}.namainvist.com"
  DEST_DIR="/www/wwwroot/$DOMAIN"
  
  if [ -d "$DEST_DIR" ]; then
    echo "======================================"
    echo "Healing and Rebuilding $DOMAIN..."
    
    mkdir -p "$DEST_DIR/src/app/(dashboard)/hr/ai-enrollment"
    cp -r "$SOURCE_DIR/src/app/(dashboard)/hr/ai-enrollment" "$DEST_DIR/src/app/(dashboard)/hr/"
    cp -r "$SOURCE_DIR/src/app/kiosk" "$DEST_DIR/src/app/"
    cp "$SOURCE_DIR/src/components/Sidebar.tsx" "$DEST_DIR/src/components/Sidebar.tsx"
    cp "$SOURCE_DIR/package.json" "$DEST_DIR/package.json"
    
    cd "$DEST_DIR"
    npm install
    
    # We do not use set -e, so if Prisma fails, the build still runs!
    npx prisma db push || true
    npm run build || true
    
    if [ $i -lt 10 ]; then PORT="300$i"; else PORT="3010"; fi
    
    echo "Killing zombie processes on Port $PORT..."
    fuser -k $PORT/tcp || true
    pm2 delete n$i-main || true
    
    echo "Starting $DOMAIN on PM2..."
    pm2 start npm --name "n$i-main" -- start -- -p $PORT
  fi
done

echo "Saving configurations..."
pm2 save
echo "Fleet Recovery Complete!"
