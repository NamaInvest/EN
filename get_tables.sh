#!/bin/bash
echo "=== OLD SERVER TABLES ==="
sudo -u postgres psql -d namadb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
