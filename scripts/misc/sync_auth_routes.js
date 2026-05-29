const { Client } = require('ssh2');
const fs = require('fs');

const signUpCode = fs.readFileSync('src/app/sign-up/[[...sign-up]]/page.tsx', 'utf8');
const signInCode = fs.readFileSync('src/app/sign-in/[[...sign-in]]/page.tsx', 'utf8');

const bashCommand = `
mkdir -p /www/wwwroot/namainvist.com/src/app/sign-up/\\[\\[...sign-up\\]\\]
mkdir -p /www/wwwroot/namainvist.com/src/app/sign-in/\\[\\[...sign-in\\]\\]

cat << 'EOF' > /www/wwwroot/namainvist.com/src/app/sign-up/\\[\\[...sign-up\\]\\]/page.tsx
${signUpCode}
EOF

cat << 'EOF' > /www/wwwroot/namainvist.com/src/app/sign-in/\\[\\[...sign-in\\]\\]/page.tsx
${signInCode}
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
    password: 'process.env.SSH_PASSWORD'
});
