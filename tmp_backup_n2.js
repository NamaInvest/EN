const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected to N2. Starting backup process...');
    
    // Create a backup tarball excluding node_modules to save space and time
    const backupCmd = 'cd /www/wwwroot && tar -czf n2_backup_before_lang.tar.gz --exclude="node_modules" --exclude=".next/cache" -C n2.namainvist.com .';
    
    console.log('[📦] Running backup command: ' + backupCmd);
    
    conn.exec(backupCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('\n[✅] N2 Backup Complete! Code: ' + code);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
