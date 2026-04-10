const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading warehouses page...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const l = 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\warehouses\\page.tsx';
        const r = '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/warehouses/page.tsx';

        sftp.fastPut(l, r, (err) => {
            if (err) {
                console.error(err);
                conn.end();
            } else {
                console.log('✅ Uploaded. Building...');
                conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                    stream.on('close', () => {
                        console.log('🎉 Done');
                        conn.end();
                    }).on('data', d => process.stdout.write(d.toString()))
                      .stderr.on('data', d => process.stderr.write(d.toString()));
                });
            }
        });
    });
}).on('error', console.error).connect(config);
