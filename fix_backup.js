/**
 * Setup pg_dump based daily backup on fleet server
 */
const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

function execCommand(conn, cmd, timeout = 120000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ code: -1, stdout: '', stderr: 'TIMEOUT' }), timeout);
        conn.exec(cmd, (err, stream) => {
            if (err) { clearTimeout(timer); return reject(err); }
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
        });
    });
}

async function run() {
    console.log('🔗 Connecting...');
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        try {
            // Create backup directory
            await execCommand(conn, 'mkdir -p /var/backups/namasoft');

            // Create backup script (using heredoc with escaped variables)
            console.log('📋 Creating backup script...');
            const cmds = [
                "cat > /usr/local/bin/namasoft-backup.sh << 'BKEOF'\n#!/bin/bash\nBACKUP_DIR=\"/var/backups/namasoft\"\nDATE=$(date +%Y%m%d_%H%M%S)\nmkdir -p $BACKUP_DIR\necho \"[$DATE] Starting backup...\"\nfor DBNAME in namadb n1_db n7_db n11_db; do\n  echo \"  Backing up $DBNAME...\"\n  sudo -u postgres pg_dump -h localhost -p 5432 $DBNAME 2>/dev/null | gzip > \"$BACKUP_DIR/${DBNAME}_${DATE}.sql.gz\"\ndone\nfind $BACKUP_DIR -name \"*.sql.gz\" -mtime +7 -delete\necho \"[$DATE] Backup complete.\"\nls -lh $BACKUP_DIR/*_${DATE}.sql.gz 2>/dev/null\nBKEOF",
                'chmod +x /usr/local/bin/namasoft-backup.sh',
            ];

            for (const cmd of cmds) {
                await execCommand(conn, cmd);
            }
            console.log('✅ Backup script created');

            // Install cron
            console.log('📋 Installing cron schedule...');
            await execCommand(conn, "cat > /etc/cron.d/namasoft-backup << 'CRONEOF'\n# NamaSoft ERP Backup Schedule\n0 2 * * * root /usr/local/bin/namasoft-backup.sh >> /var/log/namasoft-backup.log 2>&1\n0 14 * * * root /usr/local/bin/namasoft-backup.sh >> /var/log/namasoft-backup.log 2>&1\nCRONEOF");
            await execCommand(conn, 'chmod 644 /etc/cron.d/namasoft-backup');
            console.log('✅ Cron installed (2 AM + 2 PM daily)');

            // Run first backup
            console.log('\n📦 Running first backup now...');
            const res = await execCommand(conn, '/usr/local/bin/namasoft-backup.sh 2>&1', 120000);
            console.log(res.stdout || res.stderr);

            // Show backup files
            const lsRes = await execCommand(conn, 'ls -lh /var/backups/namasoft/ 2>&1');
            console.log('\n📂 Backup files:');
            console.log(lsRes.stdout);

            console.log('🎉 Backup system configured successfully!');
        } catch (err) {
            console.error('❌ Error:', err);
        } finally {
            conn.end();
        }
    });
    conn.on('error', (err) => console.error('❌ Connection error:', err));
    conn.connect(SERVER);
}

run();
