const { Client } = require('ssh2');
const fs = require('fs');

const middlewareContent = fs.readFileSync('src/middleware.ts', 'utf8');

const bashCommand = `
cat << 'EOF' > /www/wwwroot/namainvist.com/src/middleware.ts
${middlewareContent}
EOF
cat << 'EOF' > /www/wwwroot/n1.namainvist.com/src/middleware.ts
${middlewareContent}
EOF
cd /www/wwwroot/namainvist.com && npm run build > build.log 2> build_err.log && pm2 restart nama-landing
cd /www/wwwroot/n1.namainvist.com && npm run build > build.log 2> build_err.log && pm2 restart nama-main
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected');
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
