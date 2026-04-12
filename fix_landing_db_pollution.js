const { Client } = require('ssh2');

const bashCommand = `
echo "1. Cleaning polluted users from n1_db..."
sudo -u postgres psql -d n1_db -c "DELETE FROM \\"User\\" WHERE role != 'admin' AND name != 'admin';"

echo "2. Setting up dedicated landing page database..."
sudo -u postgres psql -c "CREATE DATABASE nama_main_db;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nama_main_db TO postgres;" || true

echo "3. Updating landing page environment..."
sed -i 's/n1_db:n1_pass123@localhost:5432\\/n1_db/postgres:RootPassNama123@localhost:5432\\/nama_main_db/' /www/wwwroot/namainvist.com/.env

echo "4. Pushing Prisma Schema to nama_main_db..."
cd /www/wwwroot/namainvist.com
npx prisma db push --accept-data-loss

echo "5. Restarting Landing Page..."
pm2 reload namainvist.com || pm2 reload nama-landing || pm2 reload 0
echo "Fix Complete!"
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
