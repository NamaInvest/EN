#!/bin/bash
set -e

SOURCE_DIR="/www/wwwroot/n1.namainvist.com"

for i in {2..10}; do
  DOMAIN="n${i}.namainvist.com"
  DEST_DIR="/www/wwwroot/$DOMAIN"
  
  if [ -d "$DEST_DIR" ]; then
    echo "======================================"
    echo "Updating $DOMAIN..."
    echo "======================================"
    
    mkdir -p "$DEST_DIR/src/app/api/units"
    
    cp "$SOURCE_DIR/prisma/schema.prisma" "$DEST_DIR/prisma/schema.prisma"
    cp "$SOURCE_DIR/src/app/(dashboard)/products/page.tsx" "$DEST_DIR/src/app/(dashboard)/products/page.tsx"
    cp "$SOURCE_DIR/src/app/api/pos/products/route.ts" "$DEST_DIR/src/app/api/pos/products/route.ts"
    cp "$SOURCE_DIR/src/app/api/products/[id]/route.ts" "$DEST_DIR/src/app/api/products/[id]/route.ts"
    cp "$SOURCE_DIR/src/app/api/products/route.ts" "$DEST_DIR/src/app/api/products/route.ts"
    cp "$SOURCE_DIR/src/app/api/pos/checkout/route.ts" "$DEST_DIR/src/app/api/pos/checkout/route.ts"
    cp "$SOURCE_DIR/src/app/api/units/route.ts" "$DEST_DIR/src/app/api/units/route.ts"

    cd "$DEST_DIR"
    npx prisma db push
    npm run build
  else
    echo "Directory $DEST_DIR not found. Skipping."
  fi
done

echo "======================================"
echo "Restarting all PM2 processes..."
echo "======================================"
pm2 restart all
echo "Deployment to N2-N10 complete!"
