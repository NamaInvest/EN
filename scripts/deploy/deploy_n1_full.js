const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';

function getFiles(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath));
        } else {
            files.push(fullPath.replace(/\\/g, '/'));
        }
    });
    return files;
}

// Get all required files
let allFiles = [];
['src', 'prisma', 'public'].forEach(dir => {
    allFiles = allFiles.concat(getFiles(dir));
});

['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'next.config.js', 'next.config.mjs', 'tailwind.config.ts', 'postcss.config.mjs'].forEach(file => {
    if (fs.existsSync(file)) {
        allFiles.push(file);
    }
});

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
            stream.on('data', d => console.log('mkdir out: ' + d));
            stream.stderr.on('data', d => console.log('mkdir err: ' + d));
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
                            if (done % 100 === 0) console.log(`Uploaded ${done}/${allFiles.length}`);
                        }
                        if (done + failed === allFiles.length) {
                            console.log(`Done uploads. Success: ${done}, Failed: ${failed}.`);
                            createEnvAndBuild();
                        } else {
                            processQueue();
                        }
                    });
                }
            };
            
            processQueue();
        });
    }

    function createEnvAndBuild() {
        // Create custom .env file on remote for n1
        const envContent = `DATABASE_URL="postgresql://n1_db:n1_pass123@localhost:5432/n1_db?schema=public"\nNEXT_PUBLIC_API_URL="http://n1.namainvist.com"\nPORT=3001\n`;
        const envCmd = `echo '${envContent}' > ${targetDir}/.env`;
        
        conn.exec(envCmd, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                console.log('Created .env file on remote. Starting build process...');
                // Load nvm, install deps, prisma generate, build, and start pm2
                const buildCmd = `
                    export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24
                    cd ${targetDir}
                    echo "Running npm install..."
                    npm ci --legacy-peer-deps > npm_install.log 2>&1
                    echo "Running prisma generate..."
                    npx prisma generate > prisma_generate.log 2>&1
                    echo "Running db push..."
                    npx prisma db push --accept-data-loss > prisma_push.log 2>&1
                    echo "Running next build..."
                    npm run build > build.log 2>&1
                    echo "Starting PM2..."
                    pm2 delete n1 || true
                    pm2 start npm --name "n1" -- start -- -p 3001
                    pm2 save
                `;
                
                const fullCmd = `nohup bash -c '${buildCmd.replace(/'/g, "'\\''")}' > /tmp/deploy_n1_full.log 2>&1 &`;
                
                conn.exec(fullCmd, (e2, s2) => {
                    if (e2) throw e2;
                    s2.on('close', () => {
                        console.log('Build script launched in background on ' + hostIp);
                        console.log('You can check /tmp/deploy_n1_full.log on the server for progress.');
                        conn.end();
                    });
                });
            });
        });
    }
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
