const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function exec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ Connected to Hetzner VPS...');
    try {
        const cmd = `
            DATE_STR=$(date +"%Y%m%d-%H%M%S")
            BACKUP_DIR="/www/wwwroot/namasoft-backups/$DATE_STR"
            APP_DIR="/www/wwwroot/namainvist.com"

            echo "Creating backup directory: $BACKUP_DIR"
            mkdir -p "$BACKUP_DIR"

            echo "1. Backing up Databases..."
            sudo -u postgres pg_dump -h localhost -p 5432 -F c -d n11_db -f "$BACKUP_DIR/n11_db.backup"
            sudo -u postgres pg_dump -h localhost -p 5432 -F c -d n1_db -f "$BACKUP_DIR/n1_db.backup"

            echo "2. Backing up Codebase and Dashboards..."
            tar --exclude="$APP_DIR/node_modules" --exclude="$APP_DIR/.next" --exclude="$APP_DIR/.git" -czf "$BACKUP_DIR/codebase_and_dashboards.tar.gz" -C /www/wwwroot namainvist.com

            echo "3. Backup completed!"
            ls -lh "$BACKUP_DIR"
        `;
        
        console.log('⏳ Running backup script on server... (This may take a minute)');
        const { code, stdout, stderr } = await exec(conn, cmd);
        console.log(stdout);
        if (stderr) console.error('stderr:', stderr);
        console.log(`Exit code: ${code}`);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        conn.end();
    }
});
conn.on('error', err => console.error('SSH Error:', err));
conn.connect(SERVER);
