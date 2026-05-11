require('dotenv').config({ path: '.env.local' }); // Load local env file for SSH credentials
const { Client } = require('ssh2');

// Constants
const REMOTE_ENV_PATH = '/www/wwwroot/namainvist.com/.env';
const PM2_APP_NAME = 'saas-app'; // Adjust if actual PM2 name differs in ecosystem.config.js
const SSH_HOST = process.env.DEPLOY_HOST || '46.4.188.170';
const SSH_USER = process.env.DEPLOY_USER || 'root';
const SSH_PASS = process.env.DEPLOY_PASS || '_ee4SWbxLVfH9b'; // Warning: Fallback for ease of use, but should ideally come from .env.local

const conn = new Client();

console.log('🔄 Initiating secure connection to production server...');

conn.on('ready', () => {
    console.log('✅ SSH Connection established. Executing secure commands...');

    // Enterprise-grade execution sequence:
    // 1. Generate a cryptographically secure random 64-byte hex string
    // 2. Safely append it to .env ONLY if it doesn't exist
    // 3. Reload PM2 for zero-downtime deployment
    const cmd = `
        if ! grep -q "JWT_SECRET=" "${REMOTE_ENV_PATH}"; then
            echo "Generating secure JWT_SECRET..."
            SECURE_SECRET=$(openssl rand -hex 64)
            echo "JWT_SECRET=$SECURE_SECRET" >> "${REMOTE_ENV_PATH}"
            echo "✅ JWT_SECRET successfully appended to ${REMOTE_ENV_PATH}"
        else
            echo "ℹ️ JWT_SECRET already exists. Skipping generation."
        fi

        echo "🔄 Reloading PM2 processes (Zero-Downtime)..."
        cd /www/wwwroot/namainvist.com && pm2 reload ${PM2_APP_NAME} --update-env || pm2 restart ecosystem.config.js --update-env
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('❌ Failed to execute command:', err);
            conn.end();
            return;
        }

        stream.on('data', (data) => {
            process.stdout.write(`[SERVER_OUT]: ${data}`);
        });

        stream.stderr.on('data', (data) => {
            process.stderr.write(`[SERVER_ERR]: ${data}`);
        });

        stream.on('close', (code, signal) => {
            console.log(`\n🚪 Process exited with code ${code}. Closing connection.`);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('🚨 SSH Connection Error:', err.message);
}).connect({
    host: SSH_HOST,
    port: 22,
    username: SSH_USER,
    password: SSH_PASS,
    readyTimeout: 10000 // 10 seconds timeout
});
