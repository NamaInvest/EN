const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const REMOTE_BASE = '/www/wwwroot/namainvist.com';
const LOCAL_BASE = 'd:\\namasoft9-3-main';

const DIRS_TO_CHECK = ['src/app', 'src/components', 'src/lib', 'prisma'];

function getLocalFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getLocalFiles(filePath, fileList);
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.prisma')) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
}

async function checkSync() {
    console.log('🔍 Scanning local files...');
    const localFiles = [];
    for (const dir of DIRS_TO_CHECK) {
        getLocalFiles(path.join(LOCAL_BASE, dir), localFiles);
    }
    
    const localHashes = new Map();
    for (const file of localFiles) {
        const relativePath = path.relative(LOCAL_BASE, file).replace(/\\/g, '/');
        localHashes.set(relativePath, getFileHash(file));
    }
    console.log(`✅ Found ${localHashes.size} local TS/TSX/Prisma files.`);

    const conn = new Client();
    console.log('\n🔌 Connecting to Fleet Server (46.4.188.170)...');
    
    conn.on('ready', () => {
        console.log('✅ Connected! Fetching remote hashes...\n');
        
        // Command to get MD5 of all relevant files
        const cmd = `cd ${REMOTE_BASE} && find src/app src/components src/lib prisma -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.prisma" \\) -exec md5sum {} +`;
        
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            let output = '';
            stream.on('data', d => { output += d.toString(); });
            stream.on('close', () => {
                const remoteHashes = new Map();
                const lines = output.split('\n');
                for (const line of lines) {
                    const match = line.trim().match(/^([a-f0-9]{32})\s+(.+)$/);
                    if (match) {
                        const [, hash, file] = match;
                        // remote path starts with ./ or directly src/
                        const cleanFile = file.replace(/^\.\//, '');
                        remoteHashes.set(cleanFile, hash);
                    }
                }

                console.log('==================================================');
                console.log('📊 SYNC REPORT (Local vs n1.namainvist.com)');
                console.log('==================================================');
                
                const missingOnRemote = [];
                const modifiedLocally = [];

                for (const [file, localHash] of localHashes.entries()) {
                    if (!remoteHashes.has(file)) {
                        missingOnRemote.push(file);
                    } else if (remoteHashes.get(file) !== localHash) {
                        modifiedLocally.push(file);
                    }
                }

                if (missingOnRemote.length === 0 && modifiedLocally.length === 0) {
                    console.log('🎉 Everything is perfectly in sync!');
                } else {
                    if (missingOnRemote.length > 0) {
                        console.log(`\n❌ MISSING ON SERVER (${missingOnRemote.length} files):`);
                        missingOnRemote.forEach(f => console.log(`   - ${f}`));
                    }
                    if (modifiedLocally.length > 0) {
                        console.log(`\n⚠️ MODIFIED LOCALLY (Needs Upload - ${modifiedLocally.length} files):`);
                        modifiedLocally.forEach(f => console.log(`   - ${f}`));
                    }
                    console.log(`\n💡 Total files that need deploying: ${missingOnRemote.length + modifiedLocally.length}`);
                    
                    // Generate an array string that can be copied to deploy script
                    const allToDeploy = [...missingOnRemote, ...modifiedLocally];
                    fs.writeFileSync('sync_report.json', JSON.stringify(allToDeploy, null, 4));
                    console.log('✅ Wrote sync_report.json');
                }

                conn.end();
            });
        });
    });

    conn.connect(SERVER);
}

checkSync();
