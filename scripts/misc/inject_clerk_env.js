const { Client } = require('ssh2');

const clerkEnv = `
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZmFtb3VzLXBpZ2Vvbi04Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_BeUv6XJuEilsLKUjfzVfc0m7M73duMEjd0pxcqtV7B
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
`;

const bashCommand = `
echo "${clerkEnv}" >> /www/wwwroot/namainvist.com/.env
echo "${clerkEnv}" >> /www/wwwroot/n1.namainvist.com/.env

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
    password: 'process.env.SSH_PASSWORD'
});
