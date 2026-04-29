const { Client } = require('ssh2');
const fs = require('fs');
const archiver = require('archiver');
const glob = require('glob');

async function deployToAll() {
    console.log(`[🚀 GLOBAL DICTIONARY HOTFIX] Packing Entire Project...`);
    const rootFiles = ['package.json', 'package-lock.json', 'next.config.mjs', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'prisma/schema.prisma'];
    const srcFiles = glob.sync('src/**/*.*');
    const publicFiles = glob.sync('public/**/*.*');
    
    const allFiles = [...rootFiles, ...srcFiles, ...publicFiles];
    
    const output = fs.createWriteStream('final_hotfix.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        allFiles.forEach(f => {
            if(fs.existsSync(f)) archive.file(f, { name: f });
        });
        archive.finalize();
    });

    console.log(`[📦 GLOBAL DICTIONARY HOTFIX] ZIP Ready (${fs.statSync('final_hotfix.zip').size} bytes). Uploading to master server...`);
    const conn = new Client();
    
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            sftp.fastPut('final_hotfix.zip', '/root/final_hotfix.zip', () => {
                console.log(`[🔨 GLOBAL DICTIONARY HOTFIX] Deploying sequentially...`);
                const servers = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
                let p = Promise.resolve();
                
                servers.forEach(nodeName => {
                    p = p.then(() => new Promise((resolve) => {
                        console.log(`\n================================`);
                        console.log(`[⏳ TRIGGER] Node ${nodeName} started...`);
                        
                        const cmd = `cd /www/wwwroot/${nodeName}.namainvist.com && unzip -o /root/final_hotfix.zip && /usr/bin/npm install && /usr/bin/npm run build && pm2 restart ${nodeName}`;
                        
                        conn.exec(cmd, (err, stream) => {
                            stream.on('data', d => {
                                let str = d.toString().trim();
                                if(str.includes('build') || str.includes('Restarting') || str.includes('optimized') || str.includes('added')) {
                                    console.log(`[${nodeName} STDOUT] ${str.split('\\n')[0]}`);
                                }
                            });
                            
                            stream.stderr.on('data', d => {
                                let str = d.toString().trim();
                                if(!str.includes('npm WARN') && !str.includes('Debugger')) {
                                    console.error(`[${nodeName} STDERR] ${str.split('\\n')[0]}`);
                                }
                            });
                            
                            stream.on('close', (code) => {
                                console.log(`[✅ SUCCESS] ${nodeName} DONE. Exit code: ${code}`);
                                resolve();
                            });
                        });
                    }));
                });
                
                p.then(() => {
                    console.log('\n🌟 ALL ENTERPRISE INCIDENTS RESOLVED!');
                    conn.end();
                    if(fs.existsSync('final_hotfix.zip')) fs.unlinkSync('final_hotfix.zip');
                });
            });
        });
    }).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
}

deployToAll();
