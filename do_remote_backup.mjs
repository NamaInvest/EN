import { Client } from 'ssh2';

const conn = new Client();
const serverConfig = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🚀 Connecting to production server for pre-deployment backup...');

conn.on('ready', () => {
    console.log('✅ Connected! Initializing remote backup...');
    
    const backupCmd = `
mkdir -p /www/wwwroot/backups
echo "=== [1/2] Dumping all PostgreSQL databases ==="
export PGPASSWORD="Nama2024secure"
pg_dumpall -U postgres -h localhost > /www/wwwroot/backups/pre_deploy_db_backup.sql

echo "=== [2/2] Archiving the unified codebase ==="
tar -czf /www/wwwroot/backups/pre_deploy_code_backup.tar.gz --exclude="*/node_modules" --exclude="*/.next" -C /www/wwwroot namainvist.com

echo "=== [DONE] Backup completed successfully! ==="
ls -lh /www/wwwroot/backups
`;

    conn.exec(backupCmd, (err, stream) => {
        if (err) {
            console.error('❌ SSH Execution failed:', err);
            conn.end();
            return;
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n🎉 Remote backup complete! Archives kept safely on the production server at /www/wwwroot/backups/');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(serverConfig);
