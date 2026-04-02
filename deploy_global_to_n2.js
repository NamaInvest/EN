const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const N2_IP = '46.4.188.170';
const N2_KEY = 'C:\\Users\\1\\.ssh\\id_rsa';
const REMOTE_DIR = '/var/www/namaweb';

async function deployGlobal() {
    console.log(`[n2] Starting Global Localization Deployment...`);

    // Get all modified files from git
    const stdout = execSync('git ls-files -m', { encoding: 'utf8' });
    const modifiedFiles = stdout.split('\n').map(f => f.trim()).filter(f => f.length > 0);
    
    // We only want to upload .tsx or .ts files in src
    const targetFiles = modifiedFiles.filter(f => f.startsWith('src/') && (f.endsWith('.tsx') || f.endsWith('.ts')));
    
    console.log(`[n2] Found ${targetFiles.length} modified TypeScript/React files to deploy.`);

    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('[n2] Connected. Starting SFTP upload...');
        conn.sftp((err, sftp) => {
            if (err) throw err;

            const uploadQueue = [...targetFiles];
            let activeUploads = 0;
            const PARALLEL_MAX = 5;

            function processQueue() {
                if (uploadQueue.length === 0 && activeUploads === 0) {
                    console.log('\n[n2] All files uploaded successfully.');
                    buildAndRestart();
                    return;
                }

                while (uploadQueue.length > 0 && activeUploads < PARALLEL_MAX) {
                    const localPath = uploadQueue.shift();
                    const remotePath = `${REMOTE_DIR}/${localPath.replace(/\\/g, '/')}`;
                    
                    const remoteDir = path.posix.dirname(remotePath);
                    activeUploads++;

                    // Ensure dir exists
                    conn.exec(`mkdir -p "${remoteDir}"`, (err) => {
                        sftp.fastPut(localPath, remotePath, (err) => {
                            if (err) console.error(`[n2] Error uploading ${localPath}:`, err.message);
                            else process.stdout.write('.');
                            activeUploads--;
                            processQueue();
                        });
                    });
                }
            }
            
            processQueue();
            
            function buildAndRestart() {
                console.log(`\n[n2] Upload complete. Building Next.js on Remote N2... (This will take ~1-2 minutes)`);
                conn.exec(`cd ${REMOTE_DIR} && source ~/.nvm/nvm.sh && npm run build`, (err, stream) => {
                    if (err) {
                        console.error('[n2] Remote build failed to start.');
                        conn.end();
                        return;
                    }
                    
                    let buildOutput = '';
                    stream.on('data', (data) => {
                       const str = data.toString();
                       buildOutput += str;
                       // Show a simple spinner or dots instead of spamming log
                       if (str.includes('prerendered') || str.includes('Creating an optimized')) process.stdout.write('+');
                    })
                    .stderr.on('data', (data) => {
                       process.stdout.write('!');
                    })
                    .on('close', (code) => {
                        if (code !== 0) {
                            console.error(`\n[n2] Build Failed with exit code ${code}! PM2 was NOT restarted.`);
                            console.log('--- BUILD ERROR LOG ---');
                            const errLines = buildOutput.split('\\n').filter(l => l.toLowerCase().includes('error'));
                            if (errLines.length > 0) console.log(errLines.join('\\n'));
                            console.log('-----------------------');
                            conn.end();
                        } else {
                            console.log(`\n[n2] Build Successful! Restarting PM2...`);
                            conn.exec(`pm2 restart all`, (err, restartStream) => {
                                restartStream.on('close', () => {
                                    console.log(`[n2] Deployment Complete. Application is LIVE with Global Localization.`);
                                    conn.end();
                                });
                            });
                        }
                    });
                });
            }
        });
    })
    .on('error', (err) => {
        console.error(`[n2] Connection error:`, err.message);
    })
    .connect({
        host: N2_IP,
        port: 22,
        username: 'root',
        privateKey: fs.readFileSync(N2_KEY)
    });
}

deployGlobal();
