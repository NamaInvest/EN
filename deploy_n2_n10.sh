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
    
    mkdir -p "$DEST_DIR/src/app/(dashboard)/hr/ai-enrollment"
    mkdir -p "$DEST_DIR/src/app/kiosk/attendance"
    mkdir -p "$DEST_DIR/src/app/(dashboard)/hr/evaluations"
    mkdir -p "$DEST_DIR/src/app/(dashboard)/hr/training"
    mkdir -p "$DEST_DIR/src/app/api/employees"
    mkdir -p "$DEST_DIR/src/components"

    cp "$SOURCE_DIR/prisma/schema.prisma" "$DEST_DIR/prisma/schema.prisma"
    cp "$SOURCE_DIR/package.json" "$DEST_DIR/package.json"
    cp "$SOURCE_DIR/package-lock.json" "$DEST_DIR/package-lock.json"
    cp "$SOURCE_DIR/src/app/(dashboard)/hr/ai-enrollment/page.tsx" "$DEST_DIR/src/app/(dashboard)/hr/ai-enrollment/page.tsx"
    cp "$SOURCE_DIR/src/app/kiosk/attendance/page.tsx" "$DEST_DIR/src/app/kiosk/attendance/page.tsx"
    cp "$SOURCE_DIR/src/app/(dashboard)/hr/evaluations/page.tsx" "$DEST_DIR/src/app/(dashboard)/hr/evaluations/page.tsx"
    cp "$SOURCE_DIR/src/app/(dashboard)/hr/training/page.tsx" "$DEST_DIR/src/app/(dashboard)/hr/training/page.tsx"
    cp "$SOURCE_DIR/src/app/api/employees/route.ts" "$DEST_DIR/src/app/api/employees/route.ts"
    cp "$SOURCE_DIR/src/components/Sidebar.tsx" "$DEST_DIR/src/components/Sidebar.tsx"

    cd "$DEST_DIR"
    npm install
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
