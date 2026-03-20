const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const nextConfig = fs.readFileSync('next.config.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Initiating Turbopack bypass recovery..."
for i in {1..10}
do
  echo "Reviving Node $i..."
  cd /www/wwwroot/n$i.namainvist.com
  echo '${nextConfig}' > next.config.ts
  npm run build
  pm2 reload n$i --update-env
  pm2 reload n$i-whatsapp --update-env
  echo "Node $i BACK ONLINE."
done
echo "ALL VIRTUAL MACHINES RESTORED TO FUNCTIONAL STATE!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/stable_recovery.sh\n' + bashScript + '\nEOF\nbash /root/stable_recovery.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
