const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';

function getFiles(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath));
        } else if (/\.(ts|tsx|css|json|prisma)$/.test(fullPath)) {
            files.push(fullPath.replace(/\\/g, '/'));
        }
    });
    return files;
}

const allFiles = getFiles('src').concat(['prisma/schema.prisma']);
const dirs = [...new Set(allFiles.map(f => path.dirname(f).replace(/\\/g, '/')))];

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    const splitDirs = [];
    for (let i = 0; i < dirs.length; i += 10) splitDirs.push(dirs.slice(i, i + 10));
    
    let dirGroupIndex = 0;
    const createNextDirGroup = () => {
        if (dirGroupIndex >= splitDirs.length) {
            startUploads();
            return;
        }
        const mkDirCommand = splitDirs[dirGroupIndex].map(d => `mkdir -p "${targetDir}/${d}"`).join(' && ');
        conn.exec(mkDirCommand, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                dirGroupIndex++;
                createNextDirGroup();
            });
        });
    };
    
    createNextDirGroup();

    function startUploads() {
        conn.sftp((err, sftp) => {
            if (err) throw err;
            let done = 0;
            let failed = 0;
            console.log(`Starting upload of ${allFiles.length} files to ${targetDir}...`);
            
            let active = 0;
            const limit = 20;
            let currentIndex = 0;
            
            const processQueue = () => {
                while (active < limit && currentIndex < allFiles.length) {
                    const file = allFiles[currentIndex++];
                    active++;
                    sftp.fastPut(path.resolve(file), `${targetDir}/${file}`, (e) => {
                        active--;
                        if (e) {
                            console.error(`Failed ${file}:`, e.message);
                            failed++;
                        } else {
                            done++;
                        }
                        if (done + failed === allFiles.length) {
                            console.log(`Done uploads. Success: ${done}, Failed: ${failed}. Building...`);
                            const buildCmd = `rm -f /tmp/build_n1.log && cd ${targetDir} && nohup bash -c "npx prisma generate && npm run build > /tmp/build_n1.log 2>&1 && pm2 restart n1" > /dev/null 2>&1 &`;
                            conn.exec(buildCmd, (e2, s2) => {
                                if (e2) throw e2;
                                s2.on('close', () => { console.log('Build launched in background on ' + hostIp); conn.end(); });
                            });
                        } else {
                            processQueue();
                        }
                    });
                }
            };
            
            processQueue();
        });
    }
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
