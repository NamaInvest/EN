import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const conn = new Client();
const localBackupDir = 'C:\\Backup_Namasoft_Fleet';

if (!fs.existsSync(localBackupDir)) {
    fs.mkdirSync(localBackupDir, { recursive: true });
}

console.log('🚀 Connecting to N1-N10 Master Fleet Node (46.4.188.170)...');

conn.on('ready', () => {
    console.log('✅ Connected! Generating backup of databases and all node files...');
    console.log('⏳ Please wait, archiving N1 through N10 might take a few minutes...');
    
    // Command to dump database and compress everything
    const backupCmd = `
cd /www/wwwroot
echo "[1/2] Dumping ALL PostgreSQL Databases..."
export PGPASSWORD="Nama2024secure"
pg_dumpall -U namasoft -h localhost > all_databases.sql 2>/dev/null || pg_dumpall "postgresql://namasoft:Nama2024secure@localhost:5432/postgres" > all_databases.sql


echo "[2/2] Compressing N1 to N10 sites and database into a single archive..."
# Excluding node_modules and .next to prevent a 10GB+ file that would fail to download normally.
tar -czf Fleet_Full_Backup.tar.gz --exclude="*/node_modules" --exclude="*/.next" all_databases.sql n1.namainvist.com n2.namainvist.com n3.namainvist.com n4.namainvist.com n5.namainvist.com n6.namainvist.com n7.namainvist.com n8.namainvist.com n9.namainvist.com n10.namainvist.com namainvist.com

echo "Backup generated successfully at /www/wwwroot/Fleet_Full_Backup.tar.gz"
`;

    conn.exec(backupCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n✅ Remote backup archive built successfully.');
            console.log('📥 Downloading Fleet_Full_Backup.tar.gz to your local machine (This may take a few minutes)...');
            
            conn.sftp((errSftp, sftp) => {
                if (errSftp) {
                     console.error('\n❌ SFTP failed:', errSftp);
                     conn.end();
                     return;
                }
                const remoteFile = '/www/wwwroot/Fleet_Full_Backup.tar.gz';
                const localFile = path.join(localBackupDir, 'Fleet_Full_Backup.tar.gz');
                
                sftp.fastGet(remoteFile, localFile, {
                    step: (total_transferred, chunk, total) => {
                        process.stdout.write(`\rDownloading: ${(total_transferred / (1024*1024)).toFixed(2)} MB`);
                    }
                }, (errGet) => {
                    if (errGet) {
                        console.error('\n❌ Download failed:', errGet);
                    } else {
                        console.log(`\n🎉 Backup downloaded completely to: ${localFile}`);
                        
                        // Cleanup remote backup to save space
                        conn.exec(`rm -f /www/wwwroot/Fleet_Full_Backup.tar.gz /www/wwwroot/all_databases.sql`, () => {
                            conn.end();
                        });
                    }
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
