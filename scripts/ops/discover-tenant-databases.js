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

function discoverDatabases() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            // Read-only command to list databases ending in _db
            const cmd = "sudo -u postgres psql -l | grep _db | awk '{print $1}'";
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
                        return reject(new Error(`Command failed with code ${code}: ${stderr}`));
                    }
                    const databases = stdout
                        .split('\n')
                        .map(name => name.trim())
                        .filter(name => name.endsWith('_db'));
                    resolve(databases);
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
    discoverDatabases()
        .then(dbs => {
            console.log('--- DISCOVERED_TENANT_DATABASES ---');
            console.log(JSON.stringify(dbs, null, 2));
        })
        .catch(err => {
            console.error('Failed to discover tenant databases:', err.message);
            process.exit(1);
        });
}

module.exports = { discoverDatabases };
