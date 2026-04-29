const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    console.log('Connected to N3. Uploading patched i18n.tsx...');
    conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP error:', err); conn.end(); return; }
        
        sftp.fastPut('src/lib/i18n.tsx', `${BASE}/src/lib/i18n.tsx`, (err) => {
            if (err) { console.error('Upload error:', err); conn.end(); return; }
            console.log('Uploaded i18n.tsx');
            
            // Also upload dashboard layout
            sftp.fastPut('src/app/(dashboard)/layout.tsx', `${BASE}/src/app/(dashboard)/layout.tsx`, (err) => {
                if (err) console.log('Dashboard layout upload issue:', err.message);
                else console.log('Uploaded dashboard layout.tsx');

                console.log('Clean building...');
                const cmd = `cd ${BASE} && rm -rf .next && npm run build 2>&1 | tail -5 && pm2 restart n3 2>&1 | head -3 && echo BUILD_DONE`;
                
                conn.exec(cmd, (err, stream) => {
                    if (err) { console.error('Exec error'); conn.end(); return; }
                    let out = '';
                    const timeout = setTimeout(() => { console.log('Timeout'); conn.end(); }, 180000);
                    stream.on('data', d => { out += d.toString(); process.stdout.write(d); });
                    stream.on('close', () => {
                        clearTimeout(timeout);
                        console.log(out.includes('BUILD_DONE') ? '\n🎉 N3 READY!' : '\n❌ Build issue');
                        conn.end();
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
