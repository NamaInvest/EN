const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';

const zip = new JSZip();

function addDirToZip(baseDir, currentPath, rootFolder) {
    const fullPath = path.join(baseDir, currentPath);
    if (!fs.existsSync(fullPath)) return;
    const files = fs.readdirSync(fullPath);

    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.gemini') continue;
        const p = path.join(fullPath, file);
        const stat = fs.statSync(p);
        const relPath = path.join(currentPath, file);
        // relPath already starts with 'src' or 'prisma'. We just need to replace OS-specific separators with posix '/'.
        const zipPath = relPath.split(path.sep).join('/');

        if (stat.isDirectory()) {
            addDirToZip(baseDir, relPath, rootFolder);
        } else {
            zip.file(zipPath, fs.readFileSync(p));
        }
    }
}

console.log('Packaging src folder...');
addDirToZip(__dirname, 'src', 'src');
console.log('Packaging prisma folder...');
addDirToZip(__dirname, 'prisma', 'prisma');

console.log('Generating ZIP...');
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }).then((content) => {
    fs.writeFileSync('update.zip', content);
    console.log('update.zip created perfectly. Connecting to server ' + hostIp + '...');

    const conn = new Client();
    conn.on('ready', () => {
        console.log('Connected via SSH. Uploading...');
        conn.sftp((err, sftp) => {
            if (err) throw err;
            sftp.fastPut('update.zip', `${targetDir}/update.zip`, (err) => {
                if (err) throw err;
                console.log('Upload complete. Executing deployment remote script...');
                
                const cmd = `cd ${targetDir} && unzip -q -o update.zip && echo "--- Unzip Successful, pushing DB ---" && npx prisma db push --accept-data-loss && echo "--- Prisma Generation ---" && npx prisma generate && echo "--- Next.js Build ---" && rm -rf .next && npm run build && pm2 restart n1 && echo "DEPLOYMENT_DONE_100"`;
                
                conn.exec(cmd, (e, stream) => {
                    if(e) throw e;
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', code => {
                        console.log('DONE with code: ' + code);
                        conn.end();
                    });
                });
            });
        });
    }).on('error', (err) => {
        console.error('SSH Error', err);
    }).connect({
        host: hostIp, port: 22, username: 'root',
        password: '_ee4SWbxLVfH9b',
        keepaliveInterval: 10000
    });
});
