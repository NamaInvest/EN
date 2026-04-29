#!/bin/bash
echo "=== Checking DB Tables ==="
sudo -u postgres psql -d namadb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | tr -d ' '
