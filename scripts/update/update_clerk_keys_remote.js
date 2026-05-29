const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const pubKey = 'pk_test_ZmFtb3VzLXBpZ2Vvbi04Mi5jbGVyay5hY2NvdW50cy5kZXYk';
const secKey = 'sk_test_BeUv6XJuEilsLKUjfzVfc0m7M73duMEjd0pxcqtV7B';

const execScript = `
sed -i 's/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${pubKey}/g' /www/wwwroot/namainvist.com/.env
sed -i 's/CLERK_SECRET_KEY=.*/CLERK_SECRET_KEY=${secKey}/g' /www/wwwroot/namainvist.com/.env

sed -i 's/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${pubKey}/g' /www/wwwroot/n1.namainvist.com/.env
sed -i 's/CLERK_SECRET_KEY=.*/CLERK_SECRET_KEY=${secKey}/g' /www/wwwroot/n1.namainvist.com/.env

pm2 restart namainvist
pm2 restart n1
`;

console.log('🔄 Connecting to Production Server to update Clerk Keys...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(execScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Keys Updated and Server Restarted.');
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        });
    });
}).connect(config);
