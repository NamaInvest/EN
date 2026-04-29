const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const sshUser = 'root';
const sshPass = '_ee4SWbxLVfH9b';

const conn = new Client();
conn.on('ready', () => {
    const cmd = `ldconfig && ldd /root/.cache/puppeteer/chrome/linux-146.0.7680.76/chrome-linux64/chrome | grep "not found" || echo "All libraries found."`;
    conn.exec(cmd, (e2, stream) => {
        if (e2) throw e2;
        stream.on('data', d => process.stdout.write(`[${hostIp}] ${d.toString()}`));
        stream.stderr.on('data', d => process.stderr.write(`[${hostIp}] ERR: ${d.toString()}`));
        stream.on('close', (code) => {
            console.log(`[${hostIp}] Done ldd with code ${code}`);
            
            // If it was just an environment cache issue, restarting pm2 with --update-env should fix it.
            conn.exec('export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && pm2 restart whatsapp-worker --update-env && sleep 3 && pm2 logs whatsapp-worker --lines 20 --nostream', (e3, s3) => {
                s3.on('data', d => process.stdout.write(d.toString()));
                s3.stderr.on('data', d => process.stderr.write(d.toString()));
                s3.on('close', () => conn.end());
            });
        });
    });
}).connect({host: hostIp, port: 22, username: sshUser, password: sshPass});
