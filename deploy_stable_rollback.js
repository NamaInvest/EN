const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const nextConfig = fs.readFileSync('next.config.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Initiating global stable rollback..."
for i in {1..10}
do
  echo "Rolling back n$i..."
  cd /www/wwwroot/n$i.namainvist.com
  echo '${nextConfig}' > next.config.ts
  rm -rf .next
  export NODE_OPTIONS="--max-old-space-size=4096"
  npm run build
  pm2 reload n$i --update-env
  pm2 reload n$i-whatsapp --update-env
  echo "n$i STABLE."
done
echo "ALL ENVIRONMENTS RESTORED SUCCESSFULLY!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/stable_restore.sh\n' + bashScript + '\nEOF\nbash /root/stable_restore.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
