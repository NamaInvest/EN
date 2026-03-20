const { Client } = require('ssh2');
const conn = new Client();
const bashScript = `
#!/bin/bash
echo "Force rebuilding n1..."
cd /www/wwwroot/n1.namainvist.com
rm -rf .next
npm run build
pm2 reload n1 --update-env
echo "N1 BUILD COMPLETE!"
`;
conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/force_n1.sh\n' + bashScript + '\nEOF\nbash /root/force_n1.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
