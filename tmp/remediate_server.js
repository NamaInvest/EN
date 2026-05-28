const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const legacyFiles = [
    'debug_key.ts',
    'money.test.ts',
    'bnpl.test.ts',
    'validations.test.ts',
    'usePagePermission.test.ts',
    'zatca.test.ts',
    'auto-journal.test.ts',
    'quotaGuard.test.ts',
    'financial.test.ts',
    'financial.ts'
];

const conn = new Client();

conn.on('ready', async () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    // 1. Create backup dir
    console.log('\n--- Creating backup directory for untracked legacy files ---');
    await new Promise((resolve) => {
        conn.exec('mkdir -p /www/wwwroot/namainvist.com/backups/legacy-root-files', (err, stream) => {
            stream.on('close', resolve);
        });
    });
    console.log('Backup directory created.');

    // 2. Move legacy files to backup
    console.log('\n--- Moving legacy files to backups/legacy-root-files/ ---');
    for (const file of legacyFiles) {
        await new Promise((resolve) => {
            const cmd = `mv /www/wwwroot/namainvist.com/${file} /www/wwwroot/namainvist.com/backups/legacy-root-files/ 2>/dev/null || true`;
            conn.exec(cmd, (err, stream) => {
                stream.on('close', () => {
                    console.log(`  Moved: ${file}`);
                    resolve();
                });
            });
        });
    }

    // 3. Install packages (gpt-tokenizer)
    console.log('\n--- Running npm install to resolve dependencies ---');
    await new Promise((resolve) => {
        conn.exec('cd /www/wwwroot/namainvist.com && npm install', (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stderr.write(d.toString()))
                  .on('close', resolve);
        });
    });
    
    conn.end();
}).connect(SERVER);
