const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const zip = new JSZip();

function addDirToZip(baseDir, currentPath) {
    const fullPath = path.join(baseDir, currentPath);
    const files = fs.readdirSync(fullPath);

    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.gemini') continue;

        const p = path.join(fullPath, file);
        const stat = fs.statSync(p);
        
        // Ensure forward slashes for Linux compatibility inside the zip
        const relPath = path.join(currentPath, file);
        const zipPath = path.posix.join(...relPath.split(path.sep));

        if (stat.isDirectory()) {
            addDirToZip(baseDir, relPath);
        } else {
            zip.file(zipPath, fs.readFileSync(p));
        }
    }
}

console.log('Packaging src folder...');
addDirToZip(__dirname, 'src');
console.log('Packaging prisma folder...');
addDirToZip(__dirname, 'prisma');

// Add specific files
zip.file('package.json', fs.readFileSync(path.join(__dirname, 'package.json')));
zip.file('tsconfig.json', fs.readFileSync(path.join(__dirname, 'tsconfig.json')));

console.log('Generating ZIP...');
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }).then((content) => {
    fs.writeFileSync('src.zip', content);
    console.log('src.zip created perfectly. Connecting to server 204.168.144.74...');

    const conn = new Client();
    conn.on('ready', () => {
        console.log('Connected via SSH. Uploading...');
        conn.sftp((err, sftp) => {
            if (err) throw err;
            sftp.fastPut('src.zip', '/var/www/namasoft/src.zip', (err) => {
                if (err) throw err;
                console.log('Upload complete. Executing deployment remote script...');
                
                const cmd = `
                    cd /var/www/namasoft &&
                    unzip -q -o src.zip &&
                    echo "--- Unzip Successful, pushing DB ---" &&
                    npx prisma db push --accept-data-loss &&
                    echo "--- Prisma Generation ---" &&
                    npx prisma generate &&
                    echo "--- Next.js Build ---" &&
                    rm -rf .next &&
                    npm run build &&
                    pm2 restart namasoft &&
                    echo "DEPLOYMENT_DONE_100"
                `;
                
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
        host: '204.168.144.74', port: 22, username: 'root',
        privateKey: fs.readFileSync('C:/Users/1/Desktop/namasoftkey/namasoft_key'),
        keepaliveInterval: 10000
    });
});
