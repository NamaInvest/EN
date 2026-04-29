sudo -u postgres pg_dump -d namadb --data-only --inserts > /root/namadb_data.sql
echo "Dump done, size:"
wc -c /root/namadb_data.sql
