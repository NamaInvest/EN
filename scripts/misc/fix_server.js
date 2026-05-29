const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';
const LOCAL_ROOT = __dirname;

// Recursively collect all files from a directory
function collectFiles(dir, base = '') {
    let results = [];
    const entries = fs.readdirSync(path.join(dir, base), { withFileTypes: true });
    for (const entry of entries) {
        const rel = path.join(base, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules, .next, .git
            if (['node_modules', '.next', '.git', '.agent', 'electron', 'desktop-electron'].includes(entry.name)) continue;
            results = results.concat(collectFiles(dir, rel));
        } else {
            results.push(rel.replace(/\\/g, '/'));
        }
    }
    return results;
}

// Collect src/, prisma/, and root config files
const srcFiles = collectFiles(LOCAL_ROOT, 'src');
const prismaFiles = collectFiles(LOCAL_ROOT, 'prisma');
const rootFiles = ['package.json', 'next.config.ts', 'tsconfig.json', 'postcss.config.mjs'].filter(f => 
    fs.existsSync(path.join(LOCAL_ROOT, f))
);

const allFiles = [...srcFiles, ...prismaFiles, ...rootFiles];
console.log(`📦 Total files to upload: ${allFiles.length}`);

let uploaded = 0;
let failed = 0;

conn.on('ready', () => {
    console.log('✅ Connected to fleet server');
    
    // Create all directories first
    const dirs = [...new Set(allFiles.map(f => path.posix.dirname(f)).filter(d => d !== '.'))];
    const mkdirCmd = dirs.map(d => `mkdir -p "${APP}/${d}"`).join(' && ');
    
    conn.exec(mkdirCmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            console.log('📁 Directories created');
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                // Upload files in batches of 10
                const BATCH_SIZE = 10;
                let idx = 0;
                
                function uploadBatch() {
                    const batch = allFiles.slice(idx, idx + BATCH_SIZE);
                    if (batch.length === 0) {
                        // All done - now build
                        console.log(`\n✅ Upload complete: ${uploaded} files uploaded, ${failed} failed`);
                        console.log('\n⏳ Running build on server (this takes 2-4 minutes)...');
                        
                        const buildCmd = `cd ${APP} && rm -rf .next && npx prisma generate 2>&1 | tail -3 && npm run build 2>&1 | tail -30 && pm2 restart main-site && sleep 8 && curl -s -o /dev/null -w "HTTP_STATUS: %{http_code}\\n" http://localhost:3000/ && echo "BUILD DONE"`;
                        conn.exec(buildCmd, (err, stream2) => {
                            if (err) { console.error('Build error:', err); conn.end(); return; }
                            stream2.on('data', d => process.stdout.write(d.toString()));
                            stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                            stream2.on('close', () => {
                                console.log('\n🎉 Full deploy complete');
                                conn.end();
                            });
                        });
                        return;
                    }
                    
                    let batchDone = 0;
                    batch.forEach(f => {
                        const localPath = path.join(LOCAL_ROOT, f);
                        sftp.fastPut(localPath, `${APP}/${f}`, (err) => {
                            if (err) {
                                console.log(`❌ ${f}: ${err.message}`);
                                failed++;
                            } else {
                                uploaded++;
                            }
                            batchDone++;
                            if (batchDone === batch.length) {
                                process.stdout.write(`\r📤 Uploaded: ${uploaded}/${allFiles.length} (${Math.round(uploaded/allFiles.length*100)}%)`);
                                idx += BATCH_SIZE;
                                uploadBatch();
                            }
                        });
                    });
                }
                
                uploadBatch();
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000
});
