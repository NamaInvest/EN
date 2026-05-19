const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    const cmd = `
        BACKUP_DIR=$(ls -td /www/wwwroot/namasoft-backups/* | head -1)
        echo "Fixing DB Backup for $BACKUP_DIR..."
        sudo -u postgres pg_dump -h localhost -p 5432 -F c -d n11_db -f /tmp/n11_db.backup
        sudo -u postgres pg_dump -h localhost -p 5432 -F c -d n1_db -f /tmp/n1_db.backup
        mv /tmp/n11_db.backup "$BACKUP_DIR/n11_db.backup"
        mv /tmp/n1_db.backup "$BACKUP_DIR/n1_db.backup"
        ls -lh "$BACKUP_DIR"
    `;
    const { code, stdout, stderr } = await exec(conn, cmd);
    console.log(stdout);
    if(stderr) console.log(stderr);
    conn.end();
});
conn.connect(SERVER);
