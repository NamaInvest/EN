const { Client } = require('ssh2');
const fs = require('fs');
const archiver = require('archiver');
const { execSync } = require('child_process');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 };
const ZIP_PATH = 'fleet_update.zip';
const REMOTE_ZIP_PATH = '/root/fleet_update.zip';

async function deployFleet() {
    console.log(`[Fleet] Preparing HOTFIX distribution package...`);
    
    // We get all tracked files changed, UNTRACKED files are ignored but we don't need them
    const stdout = execSync('git ls-files -m', { encoding: 'utf8' });
    const targetFiles = stdout.split('\n').map(f => f.trim()).filter(f => f.startsWith('src/') && (f.endsWith('.tsx') || f.endsWith('.ts')));
    
    if(!targetFiles.includes('src/components/Providers.tsx')) targetFiles.push('src/components/Providers.tsx');

    if(targetFiles.length === 0) { console.log('No modified files to pack!'); }
    console.log(`[Fleet] Packing ${targetFiles.length} files...`);

    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        targetFiles.forEach(file => {
            if(fs.existsSync(file)) archive.file(file, { name: file });
        });
        archive.finalize();
    });

    console.log(`[Fleet] Package created (${fs.statSync(ZIP_PATH).size} bytes). Uploading...`);

    const conn = new Client();
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            if (err) throw err;
            sftp.fastPut(ZIP_PATH, REMOTE_ZIP_PATH, (err) => {
                if (err) throw err;
                console.log(`[Fleet] Upload complete. Deploying sequentially to all Enterprise Nodes...`);
                
                const servers = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
                
                // Do the deploy sequentially to avoid OOM
                let p = Promise.resolve();
                
                servers.forEach(serverName => {
                    p = p.then(() => new Promise((resolve, reject) => {
                        const pmCwd = `/www/wwwroot/${serverName}.namainvist.com`;
                        console.log(`\n===========================================`);
                        console.log(`[${serverName}] Triggering HOTFIX deployment...`);
                        
                        // We use the direct system /usr/bin/npm path
                        const cmd = `cd ${pmCwd} && unzip -o ${REMOTE_ZIP_PATH} && /usr/bin/npm run build && pm2 restart ${serverName}`;
                        conn.exec(cmd, (execErr, execStream) => {
                            if(execErr) return reject(execErr);
                            
                            execStream.on('data', d => {
                                const str = d.toString().trim();
                                if (str.includes('optimized production build') || str.includes('Restarting app')) {
                                    console.log(`[${serverName}] > ${str.split('\\n')[0]}`);
                                }
                            });
                            execStream.stderr.on('data', d => {
                                const str = d.toString().trim();
                                if (!str.includes('npm WARN') && !str.includes('Debugger attached')) {
                                    console.log(`[${serverName} STDERR] ${str.split('\\n')[0]}`);
                                }
                            });
                            execStream.on('close', (code) => {
                                console.log(`✅ [${serverName}] Node updated and restarted! (Exit Code: ${code})`);
                                resolve();
                            });
                        });
                    }));
                });
                
                p.then(() => {
                    console.log('\n🌟 ALL ENTERPRISE NODES HOTFIX DEPLOYED SUCCESSFULLY!');
                    conn.end();
                    fs.unlinkSync(ZIP_PATH);
                }).catch(err => {
                    console.error('Failed!', err);
                    conn.end();
                });
            });
        });
    }).on('error', err => console.error(err)).connect(SSH_CONFIG);
}

deployFleet();
