#!/bin/bash
cd /www/wwwroot/n11.namainvist.com

# Get all databases ending with _db
dbs=$(su - postgres -c "psql -t -c \"SELECT datname FROM pg_database WHERE datname LIKE '%_db';\"" | grep -v '^\s*$')

for db in $dbs; do
  db_url="postgresql://postgres:RootPassNama123@localhost:5432/$db?schema=public"
  echo "Pushing schema to $db using $db_url ..."
  DATABASE_URL=$db_url npx prisma db push --accept-data-loss
done
echo "Done pushing Prisma schema to all tenants."
pm2 restart saas-app
