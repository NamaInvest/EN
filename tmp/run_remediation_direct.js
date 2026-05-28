const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

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

conn.on('ready', () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    // Construct single bash command to do everything with --legacy-peer-deps
    const backupDir = '/www/wwwroot/namainvist.com/backups/legacy-root-files';
    const moveCmds = legacyFiles.map(file => `mv /www/wwwroot/namainvist.com/${file} ${backupDir}/ 2>/dev/null || true`).join(' && ');
    const cmd = `mkdir -p ${backupDir} && ${moveCmds} && cd /www/wwwroot/namainvist.com && npm install gpt-tokenizer --legacy-peer-deps`;
    
    console.log(`Running Command:\n${cmd}\n`);
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()))
              .on('close', (code) => {
                  console.log(`\nCommand exited with code: ${code}`);
                  conn.end();
              });
    });
}).connect(SERVER);
