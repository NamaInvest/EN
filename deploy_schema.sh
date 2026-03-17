#!/bin/bash
cd /var/www/namasoft

echo "1. Backing up old schema..."
cp prisma/schema.prisma prisma/schema.prisma.backup

echo "2. Replacing with new merged schema..."
cp prisma/schema_new.prisma prisma/schema.prisma

echo "3. Generating Prisma Client..."
npm run db:generate

echo "4. Pushing schema changes to the Database..."
npx prisma db push --accept-data-loss

echo "=== SCHEMA UPDATE COMPLETE ==="
