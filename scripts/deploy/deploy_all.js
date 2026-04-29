const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function getFilesRecursively(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFilesRecursively(fullPath, fileList);
        } else {
            // Only upload relevant code files to save bandwidth and time
            if (fullPath.match(/\.(ts|tsx|js|jsx|json|css)$/)) {
                fileList.push(fullPath.replace(/\\/g, '/'));
            }
        }
    }
    return fileList;
}

// Target all relevant directories
let localFiles = [];
localFiles = getFilesRecursively('src/app', localFiles);
localFiles = getFilesRecursively('src/components', localFiles);
localFiles = getFilesRecursively('src/lib', localFiles);
localFiles.push('package.json');

async function orchestrate() {
    console.log(`Found ${localFiles.length} source files to sync natively.`);

    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    console.log('Synchronizing across all 10 production shards...');
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = `/www/wwwroot/${t}.namainvist.com`;
                        
                        console.log(`Uploading to tenant ${t} (Sequentially to avoid SSH channel limits)...`);
                        
                        console.log(`Uploading to tenant ${t} (Atomic Sequential Mode)...`);

                        // 3. Upload sequentially, one by one, creating the dir first
                        for (let j = 0; j < localFiles.length; j++) {
                            const localPath = localFiles[j];
                            const remotePath = `${rootPath}/${localPath}`;
                            const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
                            
                            await new Promise((res, rej) => {
                                conn.exec(`mkdir -p "${remoteDir}"`, (err, stream) => {
                                    if (err) return rej(err);
                                    stream.on('close', () => {
                                        sftp.fastPut(localPath, remotePath, e => e ? rej(e) : res());
                                    });
                                    stream.resume(); // consume any output to prevent hang
                                });
                            });
                            
                            if (j % 50 === 0) process.stdout.write(".");
                        }
                        
                        console.log(`\nTenant ${t} synchronized (${localFiles.length} files).`);
                    }

                    // trigger compile
                    console.log("Triggering global concurrent compilation and restart...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_full_update.log 2>&1 &',
                        'done'
                    ].join(' ');
                    
                    conn.exec(buildCmd, (err, stream) => {
                        if (err) throw err;
                        stream.resume();
                        stream.on('close', () => {
                            console.log("Successfully deployed! Servers are compiling in background.");
                            conn.end();
                            resolve();
                        });
                    });

                } catch (e) {
                    console.error(e);
                    conn.end();
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
        });
    });
}

console.log("Starting Master Synchronization...");
orchestrate()
  .then(() => console.log('Master Deployment Script Fired Successfully!'))
  .catch(e => console.error(e));
