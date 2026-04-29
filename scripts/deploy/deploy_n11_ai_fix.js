const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const FILES = [
    'src/app/api/purchases/ocr/route.ts',
    'src/app/api/stocktake/vision/route.ts',
    'src/app/api/ai-cfo/route.ts',
    'src/app/api/ai-cfo/report/route.ts',
    'src/app/api/ai-auditor/route.ts',
];

const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    console.log('✅ Connected to N11...');

    conn.exec(`mkdir -p ${FILES.map(f => `"${REMOTE_BASE}/${path.dirname(f)}"`).join(' ')}`, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) { conn.end(); return; }

                let idx = 0;
                const uploadNext = () => {
                    if (idx >= FILES.length) {
                        sftp.end();
                        console.log('\n✅ All uploaded! Building N11...');

                        const buildCmd = `cd ${REMOTE_BASE} && npm run build 2>&1 | tail -20 && pm2 restart n11 && pm2 save && echo "BUILD_OK"`;
                        conn.exec(buildCmd, (err, stream) => {
                            if (err) { conn.end(); return; }
                            stream.on('data', d => process.stdout.write(d));
                            stream.stderr.on('data', d => process.stderr.write(d));
                            stream.on('close', () => {
                                console.log('\n🚀 Done!');
                                conn.end();
                            });
                        });
                        return;
                    }

                    const rel = FILES[idx++];
                    const local = path.join(__dirname, rel);
                    const remote = `${REMOTE_BASE}/${rel}`;

                    if (!fs.existsSync(local)) {
                        console.log(`⚠️ Skipping: ${rel}`);
                        uploadNext();
                        return;
                    }

                    sftp.fastPut(local, remote, (err) => {
                        if (err) console.error(`❌ ${rel}:`, err.message);
                        else console.log(`📤 ${rel}`);
                        uploadNext();
                    });
                };
                uploadNext();
            });
        });
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
