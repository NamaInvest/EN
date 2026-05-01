#!/bin/bash
# Get all databases ending with _db
dbs=$(su - postgres -c "psql -t -c \"SELECT datname FROM pg_database WHERE datname LIKE '%_db';\"" | grep -v '^\s*$')

for db in $dbs; do
  echo "Applying to $db..."
  # Add scrap_percentage to recipes and recipe_ingredients
  su - postgres -c "psql -d $db -c 'ALTER TABLE recipes ADD COLUMN IF NOT EXISTS scrap_percentage DOUBLE PRECISION NOT NULL DEFAULT 0;'"
  su - postgres -c "psql -d $db -c 'ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS scrap_percentage DOUBLE PRECISION NOT NULL DEFAULT 0;'"
  
  # Apply the IoT and Traceability changes from earlier
  su - postgres -c "psql -d $db -f /www/wwwroot/n11.namainvist.com/update_iot.sql"
done
echo "Done applying schema to all tenants."
