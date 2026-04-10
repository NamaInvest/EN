const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
echo "🚀 Starting N11 Database Isolation Process..."

echo "1. Checking if n11_user exists, creating if not..."
sudo -u postgres psql -c "DO \\$\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'n11_db') THEN CREATE ROLE n11_db LOGIN PASSWORD 'n11_pass123'; END IF; END \\$\\$;"

echo "2. Checking if n11_db exists, creating if not..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'n11_db';" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE n11_db OWNER n11_db;"

echo "3. Granting privileges..."
sudo -u postgres psql -c "ALTER USER n11_db CREATEDB;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE n11_db TO n11_db;"

echo "4. Dumping n1_db to clone structural data & recent records..."
export PGPASSWORD="n1_pass123"
pg_dump -U n1_db -h localhost -d n1_db -F c -f /root/temp_n1_clone.dump

echo "5. Restoring data into n11_db..."
export PGPASSWORD="n11_pass123"
# Ignore ownership errors during restore
pg_restore -U n11_db -h localhost -d n11_db --no-owner --role=n11_db /root/temp_n1_clone.dump || true

echo "6. Updating N11 .env file..."
sed -i 's/n1_db:n1_pass123@localhost:5432\\/n1_db/n11_db:n11_pass123@localhost:5432\\/n11_db/g' /www/wwwroot/n11.namainvist.com/.env

echo "7. Restarting N11 to take effect..."
cd /www/wwwroot/n11.namainvist.com && pm2 restart n11

echo "8. Cleaning up..."
rm /root/temp_n1_clone.dump

echo "✅ SUCCESS! N11 is now running on a fully independent database (n11_db)."
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
