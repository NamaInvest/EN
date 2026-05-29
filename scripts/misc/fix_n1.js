const { Client } = require('ssh2');
const conn = new Client();
const bashScript = `
#!/bin/bash
echo "Fixing n1 build natively..."
cd /www/wwwroot/n1.namainvist.com
rm -rf .next
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
pm2 reload n1 --update-env
pm2 reload n1-whatsapp --update-env
echo "N1 SECURED."
`;
conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/fix_n1.sh\n' + bashScript + '\nEOF\nbash /root/fix_n1.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
});
