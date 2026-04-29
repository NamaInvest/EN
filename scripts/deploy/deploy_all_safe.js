const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

function getFiles(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath));
        } else if (/\.(ts|tsx|css|json)$/.test(fullPath)) {
            files.push(fullPath.replace(/\\/g, '/'));
        }
    });
    return files;
}

const files = getFiles('src').concat(['prisma/schema.prisma']);
const dirsToCreate = [...new Set(files.map(f => path.dirname(f).replace(/\\/g, '/')))];
const hostIp = process.argv[2] || '185.197.195.202';

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS: ' + hostIp);
    
    const mkDirBatch = async () => {
        const chunkSize = 15;
        for (let i = 0; i < dirsToCreate.length; i += chunkSize) {
            const chunk = dirsToCreate.slice(i, i + chunkSize);
            const mkDirCommand = chunk.map(d => `mkdir -p "/var/www/namasoft/${d}"`).join(' && ');
            await new Promise((resolve, reject) => {
                conn.exec(mkDirCommand, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('close', resolve);
                });
            });
        }
    };

    mkDirBatch().then(() => {
        console.log('Directories created. Starting file upload...');
        conn.sftp((err, sftp) => {
            if (err) throw err;
            let done = 0;
            for (const file of files) {
                const localPath = path.resolve('c:/Users/1/Desktop/alfa', file);
                const remotePath = `/var/www/namasoft/${file}`;
                sftp.fastPut(localPath, remotePath, (e) => {
                    done++;
                    if (e) console.error('FAIL', file, e.message);
                    
                    if (done === files.length) {
                        console.log('\\nAll files uploaded!');
                        const buildCmd = 'rm -f /tmp/rebuild_modules_status.txt && cd /var/www/namasoft && nohup bash -c "npx prisma generate && npm run build > /tmp/rebuild_modules.log 2>&1 && pm2 restart namasoft && echo DONE > /tmp/rebuild_modules_status.txt" > /dev/null 2>&1 &';
                        conn.exec(buildCmd, (e2, s2) => {
                            if (e2) throw e2;
                            s2.on('close', () => { 
                                console.log('Build kicked off in background on ' + hostIp + '!'); 
                                conn.end(); 
                            });
                        });
                    }
                });
            }
        });
    }).catch(e => console.error(e));

}).on('error', (err) => {
    console.error('Connection logic error:', err);
}).connect({
    host: hostIp, port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
