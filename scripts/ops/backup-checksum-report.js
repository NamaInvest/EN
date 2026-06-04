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

function getBackupChecksums() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            const cmd = [
                'LATEST_DIR=$(ls -d /www/wwwroot/namasoft-backups/*/ 2>/dev/null | sort | tail -n 1)',
                'if [ -n "$LATEST_DIR" ]; then',
                '  cd "$LATEST_DIR"',
                '  sha256sum *.backup *.tar.gz 2>/dev/null',
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
                    if (code !== 0 && !stdout.includes('NO_BACKUPS_FOUND')) {
                        return reject(new Error(`Command failed with code ${code}: ${stderr}`));
                    }

                    const lines = stdout.split('\n');
                    const checksums = [];

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('NO_BACKUPS_FOUND')) {
                            // format: <hash>  <filename>
                            const parts = trimmed.split(/\s+/);
                            if (parts.length >= 2) {
                                checksums.push({
                                    filename: maskSecrets(parts[1]),
                                    sha256: parts[0]
                                });
                            }
                        }
                    }

                    resolve({
                        timestamp: new Date().toISOString(),
                        checksums
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
    getBackupChecksums()
        .then(report => {
            console.log('--- BACKUP_CHECKSUMS ---');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
            console.error('Failed to get backup checksums:', err.message);
            process.exit(1);
        });
}

module.exports = { getBackupChecksums };
