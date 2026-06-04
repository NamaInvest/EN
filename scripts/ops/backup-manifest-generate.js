const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { maskSecrets } = require('../../src/lib/security/secret-masker.ts');

const keyPath = process.env.SSH_KEY_PATH || path.join(process.env.USERPROFILE || '/root', '.ssh', 'hetzner_key');
const hasKey = fs.existsSync(keyPath);
const SSH_PASSWORD = process.env.SSH_PASSWORD;

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    privateKey: hasKey ? fs.readFileSync(keyPath) : undefined,
    password: SSH_PASSWORD
};

function generateManifest() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            const cmd = [
                'LATEST_DIR=$(ls -d /www/wwwroot/namasoft-backups/*/ 2>/dev/null | sort | tail -n 1)',
                'if [ -n "$LATEST_DIR" ]; then',
                '  echo "LATEST_FOLDER: $(basename $LATEST_DIR)"',
                '  ls -la "$LATEST_DIR"',
                'else',
                '  echo "NO_BACKUPS_FOUND"',
                'fi'
            ].join('\n');

            conn.exec(cmd, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                let stdout = '', stderr = '';
                stream.on('data', d => { stdout += d; });
                stream.stderr.on('data', d => { stderr += d; });
                stream.on('close', (code) => {
                    conn.end();
                    if (code !== 0) {
                        return reject(new Error(`SSH Command failed: ${stderr}`));
                    }

                    const lines = stdout.split('\n');
                    const latestFolderLine = lines.find(l => l.startsWith('LATEST_FOLDER:'));
                    if (!latestFolderLine) {
                        return resolve({
                            timestamp: new Date().toISOString(),
                            backupFolder: null,
                            files: []
                        });
                    }

                    const backupFolder = latestFolderLine.split(':')[1].trim();
                    const files = [];

                    // Parse file listings
                    // Output format of ls -la is like: -rw-r--r-- 1 root root 4627192 May 19 00:41 n11_db.backup
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Match sizes and names
                        const match = trimmed.match(/[\s\S]+\s+(\d+)\s+[a-zA-Z]{3}\s+\d+\s+[\d:]+\s+([\w\.-]+)/);
                        if (match) {
                            const size = parseInt(match[1], 10);
                            const name = match[2];
                            if (name !== '.' && name !== '..') {
                                files.push({
                                    name: maskSecrets(name),
                                    sizeBytes: size,
                                    sizeReadable: (size / (1024 * 1024)).toFixed(2) + ' MB'
                                });
                            }
                        }
                    }

                    resolve({
                        timestamp: new Date().toISOString(),
                        backupFolder: maskSecrets(backupFolder),
                        files
                    });
                });
            });
        });
        conn.on('error', err => {
            reject(err);
        });
        conn.connect(SERVER);
    });
}

if (require.main === module) {
    generateManifest()
        .then(manifest => {
            console.log('--- BACKUP_MANIFEST ---');
            console.log(JSON.stringify(manifest, null, 2));
        })
        .catch(err => {
            console.error('Failed to generate manifest:', err.message);
            process.exit(1);
        });
}

module.exports = { generateManifest };
