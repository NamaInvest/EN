const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const c = new Client();
function upload(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
            conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
                stream.on('close', () => {
                    sftp.writeFile(remotePath, fs.readFileSync(localPath), (err) => {
                        sftp.end();
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });
    });
}
function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR'); return; }
            let out = '';
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { out += d; });
            stream.on('close', () => resolve(out));
        });
    });
}
const SITE = '/www/wwwroot/namainvist.com';
const FILES = [
    'src/lib/ab-testing.ts',
    'src/lib/ai-eval.ts',
    'src/lib/ai-personas.ts',
    'src/lib/langchain-chains.ts',
    'src/lib/mcp-bridge.ts',
    'src/lib/cdn-manager.ts',
    'src/workers/ai-queue.ts',
    'src/components/ui/data-table.tsx',
    'src/components/ui/mobile-layout.tsx',
    'src/components/ui/nama-form.tsx',
    'src/tests/test-containers.ts',
    'package.json',
    'package-lock.json'
];
c.on('ready', async () => {
    console.log('🚀 Deploying Roadmap Infrastructure to Production\n');
    for (const f of FILES) {
        const local = path.join(__dirname, f);
        if (fs.existsSync(local)) { 
            await upload(c, local, `${SITE}/${f}`); 
            console.log(`  ✅ ${f}`); 
        }
    }
    console.log('\n📦 Running npm install for new dependencies...');
    await exec(c, `cd ${SITE} && npm install --production=false 2>&1 | tail -5`);
    
    console.log('\n🔨 Building...');
    await exec(c, `cd ${SITE} && npm run build 2>&1 | tail -5`);
    
    console.log('\n🔄 Restarting PM2...');
    await exec(c, 'pm2 restart all --silent && sleep 5 && pm2 list');
    console.log('\n✅ DONE!');
    c.end();
});
c.on('error', e => console.error('❌', e.message));
c.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
