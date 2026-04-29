const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const sshUser = 'root';
const sshPass = '_ee4SWbxLVfH9b';

console.log('Installing headless Chromium dependencies on VPS...');

const conn = new Client();
conn.on('ready', () => {
    // The comprehensive list of Puppeteer required system dependencies
    const cmd = `apt-get update && apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libcairo2 libpango-1.0-0 libpangocairo-1.0-0 && export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && pm2 restart whatsapp-worker && sleep 2 && pm2 logs whatsapp-worker --lines 20 --nostream`;
    conn.exec(cmd, (e2, stream) => {
        if (e2) throw e2;
        stream.on('data', d => process.stdout.write(`[${hostIp}] ${d.toString()}`));
        stream.stderr.on('data', d => process.stderr.write(`[${hostIp}] ERR: ${d.toString()}`));
        stream.on('close', (code) => {
            console.log(`[${hostIp}] Done with code ${code}`);
            conn.end();
        });
    });
}).connect({host: hostIp, port: 22, username: sshUser, password: sshPass});
