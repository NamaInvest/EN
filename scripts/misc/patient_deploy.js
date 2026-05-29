const { Client } = require('ssh2');
const fs = require('fs');
const archiver = require('archiver');
const glob = require('glob');

async function deployNode(nodeName) {
    console.log(`[🚀 PATIENT DEPLOY] Packing Full src/ directory for ${nodeName}...`);
    const files = glob.sync('src/**/*.{ts,tsx,css,json}'); // include everything in src
    const output = fs.createWriteStream('hotfix_node.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        files.forEach(f => archive.file(f, { name: f }));
        archive.finalize();
    });

    console.log(`[📦 PATIENT DEPLOY] Packaged. Uploading to ${nodeName}...`);
    const conn = new Client();
    
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            sftp.fastPut('hotfix_node.zip', '/root/hotfix_node.zip', () => {
                console.log(`[🔨 PATIENT DEPLOY] Triggering NPM Install & Build on ${nodeName}...`);
                
                const cmd = `cd /www/wwwroot/${nodeName}.namainvist.com && unzip -o /root/hotfix_node.zip && /usr/bin/npm install && /usr/bin/npm run build && pm2 restart ${nodeName}`;
                
                conn.exec(cmd, (err, stream) => {
                    stream.on('data', d => {
                        let str = d.toString().trim();
                        if(str.includes('build') || str.includes('Restarting') || str.includes('added')) {
                            console.log(`[${nodeName} STDOUT] ${str.split('\\n')[0]}`);
                        }
                    });
                    
                    stream.stderr.on('data', d => {
                        let str = d.toString().trim();
                        if(!str.includes('npm WARN')) {
                            let firstLine = str.split('\\n')[0];
                            console.error(`[${nodeName} STDERR] ${firstLine}`);
                        }
                    });
                    
                    stream.on('close', (code) => {
                        console.log(`[✅ PATIENT DEPLOY] ${nodeName} DONE. Exit code: ${code}`);
                        conn.end();
                        if(fs.existsSync('hotfix_node.zip')) fs.unlinkSync('hotfix_node.zip');
                    });
                });
            });
        });
    }).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
}

deployNode('n1');
