const { Client } = require('ssh2');

const bashCommand = `
echo "Setting up Database with OWNER test..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS testdb99;"
sudo -u postgres psql -c "DROP ROLE IF EXISTS testdb99;"
sudo -u postgres psql -c "CREATE USER testdb99 WITH PASSWORD 'test99pass123';"
sudo -u postgres psql -c "CREATE DATABASE testdb99 OWNER testdb99;"

echo "Testing connection via Prisma..."
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
    password: 'process.env.SSH_PASSWORD'
});
