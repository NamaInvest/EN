const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
# 1. Force Drop Database
sudo -u postgres psql -c "DROP DATABASE namainvest_db WITH (FORCE);" || echo "DB already dropped"

# 2. Modify check-status json (removing namainvest)
node -e "
const fs = require('fs');
const FILE = '/tmp/namainvist_provisioned.json';
if (fs.existsSync(FILE)) {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    for (const key in data) {
        if (data[key] === 'namainvest' || data[key] === 'namainvest.namainvist.com') {
            delete data[key];
        }
    }
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
    console.log('Removed from mapping.');
}
"
`;

    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
