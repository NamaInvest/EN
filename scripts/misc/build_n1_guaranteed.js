const { Client } = require('ssh2');

function buildGuarantee() {
    const conn = new Client();
    console.log('[N1] Applying Guaranteed Build Protocols. Freeing Memory...');
    conn.on('ready', () => {
        // Stop n9, n10, and their whatsapp daemons to free up substantial RAM
        const cmd = `
            pm2 stop n9 n10 n9-whatsapp n10-whatsapp &&
            cd /www/wwwroot/n1.namainvist.com && 
            npm run build && 
            pm2 reload n1 &&
            pm2 start n9 n10 n9-whatsapp n10-whatsapp
        `;
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => console.log('STDOUT:', d.toString()));
            stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
            stream.on('close', code => {
                console.log(`[N1] Guaranteed Build Complete. Exit code: ${code}`);
                conn.end();
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}
buildGuarantee();
