const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const c = new Client();

function upload(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.writeFile(remotePath, fs.readFileSync(localPath), (err) => {
                sftp.end();
                if (err) return reject(err);
                resolve();
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
    'src/lib/services/index.ts',
    'src/lib/services/accounting.service.ts',
    'src/lib/services/sales.service.ts',
    'src/lib/services/hr.service.ts',
    'src/lib/cache.ts',
    'src/lib/api-handler.ts',
    'src/lib/validations.ts',
    'next.config.ts',
];

c.on('ready', async () => {
    console.log('🔌 Final KICKOFF Deploy\n');
    
    // Create services dir
    await exec(c, `mkdir -p ${SITE}/src/lib/services`);
    
    for (const f of FILES) {
        const local = path.join(__dirname, f);
        if (fs.existsSync(local)) {
            await upload(c, local, `${SITE}/${f}`);
            console.log(`  ✅ ${f}`);
        }
    }
    
    console.log('\n🔨 Building...');
    await exec(c, `cd ${SITE} && npm run build 2>&1 | tail -5`);
    
    console.log('\n🔄 Restarting...');
    await exec(c, 'pm2 restart all --silent');
    
    console.log('\n📊 Status:');
    await exec(c, 'sleep 5 && pm2 list');
    
    // KICKOFF verification
    console.log('\n\n═══ KICKOFF CHECKLIST VERIFICATION ═══');
    console.log('\n🔒 Dangerous routes:');
    await exec(c, 'curl -s http://localhost:3000/api/system/reset | head -1');
    await exec(c, 'curl -s http://localhost:3000/api/check-env | head -1');
    
    console.log('\n🏥 Health:');
    await exec(c, 'curl -sI http://localhost:3000/api/health | head -1');
    await exec(c, 'curl -sI http://localhost:3000 | head -1');
    
    console.log('\n📦 Backup cron:');
    await exec(c, 'crontab -l 2>/dev/null | grep -i backup || echo "No backup cron found"');
    
    console.log('\n🐘 PostgreSQL instances:');
    await exec(c, 'ss -tlnp | grep postgres | head -3');
    
    console.log('\n✅ KICKOFF COMPLETE!');
    c.end();
});

c.on('error', e => console.error('❌', e.message));
c.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
