const { Client } = require('ssh2');

const localPath = 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\sales\\orders\\create\\page.tsx';
const remoteDir = '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/sales/orders/create';
const remotePath = '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/sales/orders/create/page.tsx';

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`mkdir -p "${remoteDir}"`, (err, stream) => {
        stream.on('close', () => {
             conn.sftp((err, sftp) => {
                sftp.fastPut(localPath, remotePath, (err) => {
                    console.log('Upload OK. Building N1...');
                    conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1', (err, st) => {
                        st.on('data', d => process.stdout.write(d.toString()));
                        st.on('close', () => { console.log('✅ Done'); conn.end(); });
                    });
                });
             });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
