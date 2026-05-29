const { Client } = require('ssh2');

const conn = new Client();
console.log('🚀 Connecting to Fleet Master Node (46.4.188.170)...');

conn.on('ready', () => {
    console.log('✅ Connected! Triggering remote Next.js build on N11...');
    // Simplify build command and redirect all output
    const buildCmd = 'cd /www/wwwroot/n11.namainvist.com && source ~/.bashrc 2>/dev/null; echo "🏗️ Building..." && npm run build && echo "🔄 Restarting..." && pm2 restart n11 && echo "🎉 DONE"';
    
    conn.exec(buildCmd, (err, stream) => {
        if (err) {
            console.error('Execution Error:', err);
            conn.end();
            return;
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log(`\n✅ Remote script finished with exit code ${code}`);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
