const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
export PG_BIN="/www/server/pgsql/bin"

echo "1. Checking if we can login as postgres..."
sudo -u postgres $PG_BIN/psql -p 5432 -c "CREATE ROLE n11_db WITH LOGIN PASSWORD 'n11_pass123';" || true
sudo -u postgres $PG_BIN/psql -p 5432 -c "CREATE DATABASE n11_db OWNER n11_db;" || true
sudo -u postgres $PG_BIN/psql -p 5432 -c "ALTER DATABASE n11_db OWNER TO n11_db;" || true

echo "2. Dumping from custom PG..."
export PGPASSWORD="n1_pass123"
$PG_BIN/pg_dump -U n1_db -h localhost -p 5432 -d n1_db -F c -f /root/final_n1_clone.dump

echo "3. Restoring into custom PG n11_db..."
export PGPASSWORD="n11_pass123"
# Drop schema public in case it exists, though it's empty
sudo -u postgres $PG_BIN/psql -p 5432 -d n11_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO n11_db;"
$PG_BIN/pg_restore -U n11_db -h localhost -p 5432 -d n11_db --no-owner --role=n11_db /root/final_n1_clone.dump || true

echo "4. Restarting N11 to take effect..."
cd /www/wwwroot/n11.namainvist.com && pm2 restart n11

echo "5. Creating local backup of this newly established independent databse and codebase..."
DUMP_FILE="/root/N11_DB_BACKUP_TODAY.dump"
TAR_FILE="/root/N11_CODES_BACKUP_TODAY.tar.gz"
FINAL="/root/N11_FULL_BACKUP_FINAL.tar.gz"

$PG_BIN/pg_dump -U n11_db -h localhost -p 5432 -d n11_db -F c -f $DUMP_FILE
tar -czf $TAR_FILE -C /www/wwwroot n11.namainvist.com
tar -czf $FINAL $DUMP_FILE $TAR_FILE
rm $DUMP_FILE $TAR_FILE /root/final_n1_clone.dump

echo "✅ AAPANEL DB CLONED AND BACKUP CREATED AT $FINAL"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('\n📥 Downloading the backup to your local machine...');
            const localBackupPath = require('path').join(__dirname, '.backups', 'N11_FULL_BACKUP_FINAL.tar.gz');
            conn.sftp((err, sftp) => {
                if (err) throw err;
                sftp.fastGet('/root/N11_FULL_BACKUP_FINAL.tar.gz', localBackupPath, (err) => {
                    if (err) console.error('❌ Error downloading backup:', err);
                    else console.log(`🎉 Backup completed and saved locally to: ${localBackupPath}`);
                    conn.end();
                });
            });
        }).on('data', d => process.stdout.write(d.toString())).stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
