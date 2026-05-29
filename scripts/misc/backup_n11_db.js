const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected via SSH for backup');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/root/n11_db_backup_before_wipe_${timestamp}.sql`;
    
    // Command to execute pg_dump for n11_db via localhost TCP
    const cmd = `PGPASSWORD=n11_pass123 pg_dump -h localhost -p 5432 -U n11_db n11_db > ${filename}`;
    console.log('Executing:', cmd);
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log(`Backup process exited with code ${code}`);
            if (code === 0) {
                conn.exec(`ls -lh ${filename}`, (err, stream2) => {
                    stream2.on('data', d => process.stdout.write(d));
                    stream2.on('close', () => conn.end());
                });
            } else {
                conn.end();
            }
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).catch?.(err => console.error(err));

conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
