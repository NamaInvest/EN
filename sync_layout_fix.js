const { Client } = require('ssh2');
const fs = require('fs');

const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
const guardContent = fs.readFileSync('src/components/GlobalAuthGuard.tsx', 'utf8');

const bashCommand = `
cat << 'EOF' > /www/wwwroot/namainvist.com/src/app/layout.tsx
${layoutContent}
EOF
cat << 'EOF' > /www/wwwroot/namainvist.com/src/components/GlobalAuthGuard.tsx
${guardContent}
EOF
cd /www/wwwroot/namainvist.com && npm run build > build.log 2> build_err.log && pm2 restart nama-landing
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
