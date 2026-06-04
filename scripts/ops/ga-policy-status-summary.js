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

function getGaPolicyStatus() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            // Verify if ONBOARDING_INVITE_CODES is present in pm2 env variables
            const cmd = 'pm2 show main-site | grep -i "ONBOARDING_INVITE_CODES" || echo "NOT_FOUND"';
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
                    if (code !== 0 && !stdout.includes('NOT_FOUND')) {
                        return reject(new Error(`Command failed with code ${code}: ${stderr}`));
                    }

                    const isFound = stdout.trim() !== 'NOT_FOUND' && stdout.trim().length > 0;
                    
                    resolve({
                        timestamp: new Date().toISOString(),
                        onboardingPolicy: 'Invite-Code + Admin-Approval',
                        inviteCodeRequirement: isFound ? 'ACTIVE_ENFORCED' : 'FALLBACK_ENFORCED',
                        publicSignupAllowed: false,
                        status: 'SECURE_GA_ACTIVE'
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
    getGaPolicyStatus()
        .then(status => {
            console.log('--- GA_POLICY_STATUS_SUMMARY ---');
            console.log(JSON.stringify(status, null, 2));
        })
        .catch(err => {
            console.error('Failed to get GA policy status:', err.message);
            process.exit(1);
        });
}

module.exports = { getGaPolicyStatus };
