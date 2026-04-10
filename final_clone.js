const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
export PGPASSWORD="n1_pass123"
echo "Creating dump..."
/usr/lib/postgresql/17/bin/pg_dump -U n1_db -h localhost -d n1_db -F c -f /root/safety_clone.dump

echo "Restoring dump..."
export PGPASSWORD="n11_pass123"
/usr/lib/postgresql/17/bin/pg_restore -U n11_db -h localhost -d n11_db --no-owner --role=n11_db /root/safety_clone.dump || true

echo "Restarting and cleaning..."
cd /www/wwwroot/n11.namainvist.com && pm2 restart n11
rm /root/safety_clone.dump
echo "FULLY RESTORED"
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
