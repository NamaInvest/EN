const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading missing pages explicitly...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const files = [
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchases\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/purchases/route.ts' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\purchases\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/purchases/page.tsx' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\purchases\\options\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/purchases/options/page.tsx' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\reports\\manual-purchases\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/manual-purchases/page.tsx' }
        ];

        conn.exec('mkdir -p "/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/purchases/options" && mkdir -p "/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/manual-purchases"', (err, stream) => {
            stream.on('close', async () => {
                try {
                    for(const {l, r} of files) {
                        console.log('Uploading: ' + l + ' to ' + r);
                        await new Promise((res, rej) => sftp.fastPut(l, r, (err) => err ? rej(err) : res()));
                        console.log('✅ Success: ' + r);
                    }
                    console.log('✨ All uploads done. Building...');
                    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                        stream.on('close', () => {
                            conn.end();
                            console.log('🎉 Done');
                        }).on('data', d => process.stdout.write(typeof d === 'string' ? d : d.toString()));
                    });
                } catch(e) {
                    console.error('Upload Error:', e);
                    conn.end();
                }
            });
        });
    });
}).on('error', console.error).connect(config);
