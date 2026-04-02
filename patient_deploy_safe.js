const { Client } = require('ssh2');
const fs = require('fs');
const archiver = require('archiver');
const glob = require('glob');

async function deployNodeSafe(nodeName) {
    console.log(`[🚀 GLOBAL PATIENT] Packing Entire Project for ${nodeName}...`);
    // Grabbing all essential files from root
    const rootFiles = ['package.json', 'package-lock.json', 'next.config.mjs', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'prisma/schema.prisma'];
    const srcFiles = glob.sync('src/**/*.*');
    const publicFiles = glob.sync('public/**/*.*');
    
    const allFiles = [...rootFiles, ...srcFiles, ...publicFiles];
    
    const output = fs.createWriteStream('hotfix_node_safe.zip');
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

    console.log(`[📦 GLOBAL PATIENT] ZIP Ready (${fs.statSync('hotfix_node_safe.zip').size} bytes). Uploading to ${nodeName}...`);
    const conn = new Client();
    
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            sftp.fastPut('hotfix_node_safe.zip', '/root/hotfix_node_safe.zip', () => {
                console.log(`[🔨 GLOBAL PATIENT] Unzipping and running npm install & build on ${nodeName}...`);
                
                const cmd = `cd /www/wwwroot/${nodeName}.namainvist.com && unzip -o /root/hotfix_node_safe.zip && /usr/bin/npm install && /usr/bin/npm run build && pm2 restart ${nodeName}`;
                
                conn.exec(cmd, (err, stream) => {
                    stream.on('data', d => {
                        let str = d.toString().trim();
                        if(str.includes('build') || str.includes('Restarting') || str.includes('added') || str.includes('optimized')) {
                            console.log(`[${nodeName} STDOUT] ${str.split('\\n')[0]}`);
                        }
                    });
                    
                    stream.stderr.on('data', d => {
                        let str = d.toString().trim();
                        if(!str.includes('npm WARN') && !str.includes('Debugger')) {
                            let firstLine = str.split('\\n')[0];
                            console.error(`[${nodeName} STDERR] ${firstLine}`);
                        }
                    });
                    
                    stream.on('close', (code) => {
                        console.log(`[✅ GLOBAL PATIENT] ${nodeName} DONE. Exit code: ${code}`);
                        conn.end();
                        if(fs.existsSync('hotfix_node_safe.zip')) fs.unlinkSync('hotfix_node_safe.zip');
                    });
                });
            });
        });
    }).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
}

deployNodeSafe('n1');
