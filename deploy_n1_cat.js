const { Client } = require('ssh2');

function buildGuarantee() {
    const conn = new Client();
    console.log('[N1] Applying Fast Categories Bar CSS Update...');
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            if (err) throw err;
            sftp.fastPut('d:/namasoft9-3-main/src/app/pos/page.tsx', '/www/wwwroot/n1.namainvist.com/src/app/pos/page.tsx', (err) => {
                if (err) throw err;
                console.log('[N1] Categories Bar Fixed! Recompiling cleanly...');
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
                        console.log(`[N1] Categories Build Complete. Exit code: ${code}`);
                        conn.end();
                    });
                });
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
}
buildGuarantee();
