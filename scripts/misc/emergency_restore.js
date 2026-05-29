const { Client } = require('ssh2');
const conn = new Client();
const bashScript = `
#!/bin/bash
echo "STARTING EMERGENCY RESTORE AND BUILD..."
for i in {1..10}
do
  echo "Restoring Node $i..."
  cd /www/wwwroot/n$i.namainvist.com
  npm i @ducanh2912/next-pwa --legacy-peer-deps
  npm run build
  pm2 reload n$i --update-env
  pm2 reload n$i-whatsapp --update-env
  echo "Node $i is ONLINE."
done
echo "ALL NODES SECURE!"
`;
conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/emergency_restore.sh\n' + bashScript + '\nEOF\nbash /root/emergency_restore.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
});
