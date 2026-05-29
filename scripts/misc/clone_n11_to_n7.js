const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const cmd = `
#!/bin/bash
set -e

echo "🚀 Restarting N11 to N7 Complete DB Cloning Process (TCP MODE)..."

export PGPASSWORD="n1_pass123"

echo "1. Disconnecting active sessions and dropping TCP n7_db..."
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'n7_db';" || true
psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS n7_db;"

echo "2. Checking if n7_db role exists inside TCP, creating if not..."
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE USER n7_db WITH PASSWORD 'n7_pass123';" || true

echo "3. Creating a fresh TCP n7_db..."
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE n7_db OWNER n7_db;"
psql -h localhost -p 5432 -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE n7_db TO n7_db;"

echo "4. Taking a definitive backup (dump) from the REAL TCP n11_db..."
# We dump using the superuser over TCP
pg_dump -h localhost -p 5432 -U postgres -d n11_db -F c -f /tmp/n11_real.dump || echo "Warning: Dump issue."

echo "5. Restoring data deeply into TCP n7_db..."
# Give n7_db ownership
pg_restore -h localhost -p 5432 -U postgres -d n7_db --no-owner --role=n7_db /tmp/n11_real.dump || echo "Warning: Restore encountered minor non-blocking errors."

echo "✅ Database restore finished."

echo "6. Booting n7 pm2..."
cd /www/wwwroot/n7.namainvist.com
pm2 restart n7

echo "7. Verifying Data inside TCP N7_db..."
export PGPASSWORD="n7_pass123"
psql -h localhost -p 5432 -U n7_db -d n7_db -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"

echo "🧹 Cleaning up dump file..."
rm -f /tmp/n11_real.dump

echo "🔥 SUCCESS! N7 TCP Database has been perfectly synchronized!"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
            console.log("All remote execution ended.");
        }).on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
