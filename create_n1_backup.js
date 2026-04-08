const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const password = '_ee4SWbxLVfH9b';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const tarName = `n1_backup_${timestamp}.tar.gz`;
const dbDmpName = `n1_db_backup_${timestamp}.dump`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    console.log('Starting full database backup of N1...');
    
    // We already have the tar backup, let's just make the db backup, but we'll include tar just in case or just db?
    // Let's just do DB to be fast and correct the error since tar already succeeded.
    const dbCmd = `cd /www/wwwroot && PGPASSWORD=n1_pass123 /www/server/pgsql/bin/pg_dump -U n1_db -h localhost -p 5432 -d n1_db -F c -f ${dbDmpName}`;

    const fullCmd = `${dbCmd} && echo "SUCCESS"`;

    conn.exec(fullCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write('OUT: ' + d));
        stream.stderr.on('data', d => process.stderr.write('ERR: ' + d));
        stream.on('close', (code) => {
            if (code === 0) {
                console.log(`\n✅ Backup completed successfully.`);
                console.log(`Database backup created in /www/wwwroot/${dbDmpName}`);
            } else {
                console.log(`\n❌ Backup failed with exit code ${code}.`);
            }
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: password, keepaliveInterval: 10000 });
