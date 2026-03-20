const { Client } = require('ssh2');
const conn = new Client();
const bashScript = `
#!/bin/bash
for i in {1..10}
do
  echo "Rebuilding n$i..."
  (
    cd /www/wwwroot/n$i.namainvist.com
    npm run build > build_pwa.log 2>&1
    pm2 reload n$i --update-env
    pm2 reload n$i-whatsapp --update-env
  ) &
done
wait
echo "ALL BUILDS COMPLETE!"
`;
conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/rebuild_pwa.sh\n' + bashScript + '\nEOF\nbash /root/rebuild_pwa.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
