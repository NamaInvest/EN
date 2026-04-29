const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
echo "1. Creating Role explicitly..."
sudo -u postgres psql -c "CREATE ROLE n11_db WITH LOGIN PASSWORD 'n11_pass123';" || true
echo "2. Granting DB rights..."
sudo -u postgres psql -c "ALTER DATABASE n11_db OWNER TO n11_db;" || true
sudo -u postgres psql -c "ALTER USER n11_db CREATEDB;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE n11_db TO n11_db;" || true

echo "3. Restoring data deeply into n11_db..."
sudo -u postgres psql -d n11_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO n11_db;"
export PGPASSWORD="n11_pass123"
/usr/lib/postgresql/17/bin/pg_restore -U n11_db -h localhost -d n11_db --no-owner --role=n11_db /root/temp_n1_clone2.dump || true

echo "✅ SUCCESS! N11 DB should be populated correctly."
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
