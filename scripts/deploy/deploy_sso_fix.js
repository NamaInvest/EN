const { Client } = require('ssh2');
const fs = require('fs');

const files = {
    'src/components/SessionGuard.tsx': fs.readFileSync('src/components/SessionGuard.tsx', 'utf8'),
    'src/app/api/auth/me/route.ts': fs.readFileSync('src/app/api/auth/me/route.ts', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('Deploying SSO fixes to Root & N1...');
    
    conn.exec('mkdir -p /www/wwwroot/tenant_n1/src/app/api/auth/me && mkdir -p /www/wwwroot/namainvist.com/src/app/api/auth/me', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                let pending = 0;
                const upload = (path, content) => {
                    pending++;
                    const writeStream = sftp.createWriteStream(path);
                    writeStream.write(content);
                    writeStream.end();
                    writeStream.on('close', () => {
                        pending--;
                        if (pending === 0) runBuilds();
                    });
                };

                // Node N1
                upload('/www/wwwroot/tenant_n1/src/components/SessionGuard.tsx', files['src/components/SessionGuard.tsx']);
                upload('/www/wwwroot/tenant_n1/src/app/api/auth/me/route.ts', files['src/app/api/auth/me/route.ts']);

                // Root Domain
                upload('/www/wwwroot/namainvist.com/src/components/SessionGuard.tsx', files['src/components/SessionGuard.tsx']);
                upload('/www/wwwroot/namainvist.com/src/app/api/auth/me/route.ts', files['src/app/api/auth/me/route.ts']);
                
                function runBuilds() {
                    const cmd = `
                        echo "Building N1..." &&
                        cd /www/wwwroot/tenant_n1 && npm run build && pm2 restart n1 --update-env &&
                        echo "Building ROOT..." &&
                        cd /www/wwwroot/namainvist.com && npm run build && pm2 restart namainvist_root --update-env &&
                        echo "✅ SSO SYNC DEPLOYED AND COMPLETED."
                    `;
                    conn.exec(cmd, (err, execStream) => {
                        if (err) throw err;
                        execStream.on('close', () => conn.end())
                              .on('data', data => console.log(data.toString()))
                              .stderr.on('data', data => console.error(data.toString()));
                    });
                }
            });
        });
    });

}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
