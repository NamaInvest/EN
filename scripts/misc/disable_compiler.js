const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';
conn.on('ready', () => {
    const cmd = `cd ${BASE} && \\
sed -i "s/reactCompiler: true/reactCompiler: false/g" next.config.ts && \\
echo "=== React Compiler Disabled ===" && \\
grep reactCompiler next.config.ts && \\
echo "=== Rebuilding... ===" && \\
rm -rf .next && \\
npm run build 2>&1 | tail -10 && \\
echo "=== Restarting PM2 ===" && \\
pm2 restart n3`;
    
    conn.exec(cmd, (err, stream) => {
        let out = '';
        const timeout = setTimeout(() => { console.log('Timeout'); conn.end(); }, 180000);
        stream.on('data', d => { out += d.toString(); process.stdout.write(d); });
        stream.on('close', () => {
            clearTimeout(timeout);
            console.log(out);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
