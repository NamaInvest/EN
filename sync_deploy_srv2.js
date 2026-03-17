const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const hostIp = '95.217.187.44';

function getFiles(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath));
        } else if (/\.(ts|tsx|css|json|prisma|js)$/.test(fullPath)) {
            files.push(fullPath.replace(/\\/g, '/'));
        }
    });
    return files;
}

const filesToUpload = [
    'src/app/api/coupons/route.ts',
    'src/app/api/coupons/[id]/route.ts',
    'src/app/(dashboard)/coupons/page.tsx',
    'src/app/api/loyalty/route.ts',
    'src/app/api/loyalty/[customerId]/transactions/route.ts',
    'src/app/(dashboard)/loyalty/page.tsx',
    'src/app/api/gift-cards/route.ts',
    'src/app/api/gift-cards/[id]/route.ts',
    'src/app/(dashboard)/gift-cards/page.tsx',
    'src/app/api/audit-logs/route.ts',
    'src/app/(dashboard)/audit-logs/page.tsx',
    'src/app/api/batches/route.ts',
    'src/app/api/batches/[id]/route.ts',
    'src/app/(dashboard)/batches/page.tsx',
    'src/components/Sidebar.tsx',
    'src/lib/i18n.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/login/page.tsx',
    'src/components/InactivityGuard.tsx',
    'src/app/api/sales/route.ts',
    'src/app/api/banks/[id]/route.ts',
    'src/app/api/banks/[id]/transactions/route.ts',
    'src/app/api/expenses/route.ts',
    'src/app/api/manufacturing/recipes/route.ts',
    'src/app/api/shifts/route.ts',
];

const dirs = [...new Set(filesToUpload.map(f => path.dirname(f).replace(/\\/g, '/')))];

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
        const mkDirCommand = splitDirs[dirGroupIndex].map(d => `mkdir -p "/var/www/namasoft/${d}"`).join(' && ');
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
            console.log(`Starting upload of ${filesToUpload.length} files...`);
            
            let active = 0;
            const limit = 5;
            let currentIndex = 0;
            
            const processQueue = () => {
                while (active < limit && currentIndex < filesToUpload.length) {
                    const file = filesToUpload[currentIndex++];
                    active++;
                    sftp.fastPut(path.resolve(file), `/var/www/namasoft/${file}`, (e) => {
                        active--;
                        if (e) {
                            console.error(`Failed ${file}:`, e.message);
                            failed++;
                        } else {
                            done++;
                        }
                        if (done + failed === filesToUpload.length) {
                            console.log(`Done uploads. Success: ${done}, Failed: ${failed}. Building...`);
                            const buildCmd = 'rm -f /tmp/build_sync.log && cd /var/www/namasoft && nohup bash -c "npm run build > /tmp/build_sync.log 2>&1 && pm2 reload namasoft" > /dev/null 2>&1 &';
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
}).connect({ 
    host: hostIp, port: 22, username: 'root', 
    privateKey: fs.readFileSync('C:/Users/1/.ssh/hetzner_key'), 
    keepaliveInterval: 10000 
});
