sudo -u postgres psql -c "CREATE USER namasoft WITH PASSWORD 'Nama2024secure';"
sudo -u postgres psql -c "CREATE DATABASE namadb OWNER namasoft;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE namadb TO namasoft;"
sudo -u postgres psql -d namadb -c "GRANT ALL ON SCHEMA public TO namasoft;"
