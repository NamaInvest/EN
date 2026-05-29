const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const dateStr = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
const dbDumpFile = `/root/n11_db_backup_${dateStr}.dump`;
const filesDumpFile = `/root/n11_files_backup_${dateStr}.tar.gz`;
const finalBackupFile = `/root/N11_FULL_BACKUP_${dateStr}.tar.gz`;

// Local directory
const localBackupDir = path.join(__dirname, '.backups');
if (!fs.existsSync(localBackupDir)) {
    fs.mkdirSync(localBackupDir);
}
const localBackupPath = path.join(localBackupDir, `N11_FULL_BACKUP_${dateStr}.tar.gz`);

console.log(`🚀 Starting Full Backup process for N11 (${dateStr})...`);

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to N11. Generating Database Dump...');
    
    // Command sequence using pg_dump 17 and targeted specifically to n11_db
    const cmd = `
        export PGPASSWORD="n11_pass123"
        /usr/lib/postgresql/17/bin/pg_dump -U n11_db -h localhost -d n11_db -F c -f ${dbDumpFile}
        echo "✅ Database dumped to ${dbDumpFile}"
        
        echo "📦 Archiving N11 Web Directory..."
        tar -czf ${filesDumpFile} -C /www/wwwroot n11.namainvist.com
        echo "✅ Files archived to ${filesDumpFile}"
        
        echo "🗜️ Packaging everything into one archive..."
        tar -czf ${finalBackupFile} ${dbDumpFile} ${filesDumpFile}
        echo "✅ Final Backup Package created at: ${finalBackupFile}"
        
        # Cleanup temp
        rm ${dbDumpFile} ${filesDumpFile}
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('\n📥 Downloading the backup to your local machine...');
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                sftp.fastGet(finalBackupFile, localBackupPath, (err) => {
                    if (err) {
                        console.error('❌ Error downloading backup:', err);
                    } else {
                        console.log(`🎉 Backup completed and saved locally to: ${localBackupPath}`);
                    }
                    conn.end();
                });
            });
            
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
