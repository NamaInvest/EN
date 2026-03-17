sudo -u postgres psql -d namadb -c "SELECT id, username, password_hash FROM users;"
