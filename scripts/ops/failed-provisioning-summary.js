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

function getFailedProvisioningSummary() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            // Find [InMemoryWorker] or [provision] errors in main-site logs
            const cmd = 'pm2 logs main-site --lines 400 --nostream | grep -iE "\\[(InMemoryWorker|provision)\\]" | grep -iE "(fail|error)" || echo "NO_PROVISIONING_ERRORS"';
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
                    if (code !== 0 && !stdout.includes('NO_PROVISIONING_ERRORS')) {
                        return reject(new Error(`Command failed with code ${code}: ${stderr}`));
                    }

                    const lines = stdout.split('\n');
                    const failures = [];

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.includes('NO_PROVISIONING_ERRORS')) {
                            // Extract details from logs
                            failures.push(maskSecrets(trimmed));
                        }
                    }

                    resolve({
                        timestamp: new Date().toISOString(),
                        failedAttemptsCount: failures.length,
                        recentFailures: failures.slice(0, 10)
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
    getFailedProvisioningSummary()
        .then(summary => {
            console.log('--- FAILED_PROVISIONING_SUMMARY ---');
            console.log(JSON.stringify(summary, null, 2));
        })
        .catch(err => {
            console.error('Failed to get provisioning summary:', err.message);
            process.exit(1);
        });
}

module.exports = { getFailedProvisioningSummary };
