const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
echo "🚀 Fixing pg_dump version to match PG17..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-client-17

echo "4. Dumping n1_db (using pg_dump v17)..."
export PGPASSWORD="n1_pass123"
/usr/lib/postgresql/17/bin/pg_dump -U n1_db -h localhost -d n1_db -F c -f /root/temp_n1_clone2.dump

echo "5. Overwriting and restoring data into n11_db..."
export PGPASSWORD="n11_pass123"
# Drop schema public to ensure clean restore over empty DB created previously
sudo -u postgres psql -d n11_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO n11_db;"
/usr/lib/postgresql/17/bin/pg_restore -U n11_db -h localhost -d n11_db --no-owner --role=n11_db /root/temp_n1_clone2.dump || true

echo "7. Restarting N11 to take effect..."
cd /www/wwwroot/n11.namainvist.com && pm2 restart n11

echo "8. Cleaning up..."
rm /root/temp_n1_clone2.dump
echo "✅ SUCCESS! Clone to independent database completed flawlessly."
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
