const { discoverDatabases } = require('./discover-tenant-databases');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

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

function getBackupCoverage() {
    return new Promise(async (resolve, reject) => {
        try {
            const databases = await discoverDatabases();
            const conn = new Client();
            
            conn.on('ready', () => {
                // Find latest backup directory and list files in it
                const cmd = [
                    'LATEST_DIR=$(ls -d /www/wwwroot/namasoft-backups/*/ 2>/dev/null | sort | tail -n 1)',
                    'if [ -n "$LATEST_DIR" ]; then',
                    '  echo "LATEST_FOLDER: $(basename $LATEST_DIR)"',
                    '  ls -lh "$LATEST_DIR"',
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
                            return reject(new Error(`Command failed: ${stderr}`));
                        }

                        const lines = stdout.split('\n');
                        const latestFolderLine = lines.find(l => l.startsWith('LATEST_FOLDER:'));
                        
                        if (!latestFolderLine) {
                            return resolve({
                                latestBackupFolder: null,
                                totalDatabases: databases.length,
                                backedUpDatabases: [],
                                missingDatabases: databases,
                                coveragePercentage: 0
                            });
                        }

                        const latestBackupFolder = latestFolderLine.split(':')[1].trim();
                        const backedUpDbs = [];

                        // Parse psql backup files from directory list (e.g. n11_db.backup)
                        for (const line of lines) {
                            const match = line.trim().match(/([a-z0-9_]+_db)\.backup/i);
                            if (match) {
                                backedUpDbs.push(match[1]);
                            }
                        }

                        const missingDatabases = databases.filter(db => !backedUpDbs.includes(db));
                        const coveragePercentage = databases.length > 0 
                            ? Math.round((backedUpDbs.length / databases.length) * 100)
                            : 100;

                        resolve({
                            latestBackupFolder,
                            totalDatabases: databases.length,
                            backedUpDatabases: backedUpDbs,
                            missingDatabases,
                            coveragePercentage
                        });
                    });
                });
            });
            conn.on('error', err => {
                reject(err);
            });
            conn.connect(SERVER);
        } catch (err) {
            reject(err);
        }
    });
}

if (require.main === module) {
    getBackupCoverage()
        .then(report => {
            console.log('--- BACKUP_COVERAGE_REPORT ---');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
            console.error('Failed to generate backup coverage report:', err.message);
            process.exit(1);
        });
}

module.exports = { getBackupCoverage };
