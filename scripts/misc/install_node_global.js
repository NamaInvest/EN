const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const conn = new Client();

const cmd = `
apt-get update
apt-get install -y ca-certificates curl gnupg
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs
npm install -g pm2
node -v
npm -v
pm2 -v
`;

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
            console.log('NodeJS installed successfully.');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
