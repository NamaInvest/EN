const { Client } = require('ssh2');

const bashCommand = `
cat > /www/wwwroot/ice.namainvist.com/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "ice",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3012",
    cwd: "/www/wwwroot/ice.namainvist.com"
  }]
}
EOF

pm2 delete ice || true
cd /www/wwwroot/ice.namainvist.com
pm2 start ecosystem.config.js
pm2 save
pm2 logs ice --lines 20
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
