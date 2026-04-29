const { Client } = require('ssh2');

const bashCommand = `
DB_NAME="testdb99"
sub_domain="test99"

echo "Setting up Database \$DB_NAME..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS testdb99;"
sudo -u postgres psql -c "DROP ROLE IF EXISTS testdb99;"
sudo -u postgres psql -c "CREATE DATABASE testdb99;"
sudo -u postgres psql -c "CREATE USER testdb99 WITH PASSWORD 'test99pass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE testdb99 TO testdb99;"
sudo -u postgres psql -d testdb99 -c "ALTER SCHEMA public OWNER TO testdb99;"
sudo -u postgres psql -d testdb99 -c "GRANT ALL ON SCHEMA public TO testdb99;"

echo "Testing connection and dropping table via Prisma..."
cd /www/wwwroot/namainvist.com
DATABASE_URL="postgresql://testdb99:test99pass123@localhost:5432/testdb99?schema=public" npx prisma db push --accept-data-loss
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
