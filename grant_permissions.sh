#!/bin/bash
cd /www/wwwroot/n11.namainvist.com

# Get all databases ending with _db
dbs=$(su - postgres -c "psql -t -c \"SELECT datname FROM pg_database WHERE datname LIKE '%_db';\"" | grep -v '^\s*$')

for db in $dbs; do
  echo "Granting permissions on $db ..."
  su - postgres -c "psql -d $db -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;'"
  su - postgres -c "psql -d $db -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n11_db;'"
done
echo "Done granting permissions."
