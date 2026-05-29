/**
 * Deploy KICKOFF Day 1 Security Hardening to Fleet
 * Deploys only the changed files (middleware, sentry configs, disabled routes, health)
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const ARCHIVE_NAME = 'security_hardening.tar.gz';
const LOCAL_ARCHIVE = path.join(__dirname, ARCHIVE_NAME);
const REMOTE_ARCHIVE = `/root/${ARCHIVE_NAME}`;

// Only files changed in KICKOFF Day 1
const FILES_TO_DEPLOY = [
    'middleware.ts',
    'sentry.server.config.ts',
    'sentry.client.config.ts',
    'sentry.edge.config.ts',
    'src/app/api/system/reset/route.ts',
    'src/app/api/check-env/route.ts',
    'src/app/api/health/route.ts',
    '.github/dependabot.yml',
    '.github/CODEOWNERS',
];

const NODES = [
    { path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' },
];

function execCommand(conn, cmd) {
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

async function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function run() {
    // 1. Create tar archive of changed files
    console.log('📦 Creating archive of security hardening files...');
    const fileList = FILES_TO_DEPLOY.filter(f => fs.existsSync(path.join(__dirname, f)));
    console.log(`   Files: ${fileList.length}`);
    
    const tarCmd = `tar -czf ${ARCHIVE_NAME} ${fileList.join(' ')}`;
    execSync(tarCmd, { cwd: __dirname, stdio: 'inherit' });
    
    const archiveSize = (fs.statSync(LOCAL_ARCHIVE).size / 1024).toFixed(1);
    console.log(`   Archive size: ${archiveSize} KB`);
    
    // 2. Connect and deploy
    console.log('\n🔗 Connecting to fleet server (46.4.188.170)...');
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('✅ Connected!');
        conn.sftp(async (err, sftp) => {
            if (err) throw err;
            try {
                console.log('📤 Uploading archive...');
                await uploadFile(sftp, LOCAL_ARCHIVE, REMOTE_ARCHIVE);
                console.log('✅ Upload complete.\n');

                for (const node of NODES) {
                    console.log(`\n${'='.repeat(60)}`);
                    console.log(`🖥️  Processing ${node.path}`);
                    console.log(`${'='.repeat(60)}`);
                    
                    // Extract files
                    console.log('📂 Extracting files...');
                    let res = await execCommand(conn, `cd ${node.path} && tar -xzf ${REMOTE_ARCHIVE}`);
                    if (res.code !== 0) console.error('  ⚠️', res.stderr);
                    else console.log('  ✅ Extracted');

                    // Rebuild
                    console.log('🔨 Building Next.js (this may take a few minutes)...');
                    res = await execCommand(conn, `cd ${node.path} && rm -rf .next && npm run build 2>&1 | tail -5`);
                    console.log(res.stdout);
                    if (res.code !== 0) {
                        console.error('  ⚠️ Build may have issues:', res.stderr.substring(0, 200));
                    } else {
                        console.log('  ✅ Build complete');
                    }

                    // Restart PM2
                    console.log(`🔄 Restarting PM2 (${node.pm2})...`);
                    res = await execCommand(conn, `pm2 restart ${node.pm2}`);
                    console.log('  ✅ Restarted');
                }

                // Cleanup
                await execCommand(conn, `rm ${REMOTE_ARCHIVE}`);
                fs.unlinkSync(LOCAL_ARCHIVE);
                
                console.log('\n🎉 Deployment complete! All nodes updated with security hardening.');
                
            } catch (err) {
                console.error('❌ Deployment failed:', err);
            } finally {
                conn.end();
            }
        });
    });
    
    conn.on('error', (err) => {
        console.error('❌ Connection error:', err);
    });

    conn.connect(SERVER);
}

run();
