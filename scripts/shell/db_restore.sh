sudo -u postgres psql -d namadb -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$\$;"
echo "Tables truncated"
sudo -u postgres psql -d namadb < /root/namadb_data.sql
echo "Data restored"
sudo -u postgres psql -d namadb -c "SELECT relname AS table, n_live_tup AS rows FROM pg_stat_user_tables WHERE n_live_tup > 0 ORDER BY n_live_tup DESC;"
