const { Client } = require('ssh2');
const fs = require('fs');

const files = {
    'src/app/master/page.tsx': fs.readFileSync('src/app/master/page.tsx', 'utf8'),
    'src/app/api/master/route.ts': fs.readFileSync('src/app/api/master/route.ts', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('Deploying new Master Panel to root domain...');
    
    conn.exec('mkdir -p /www/wwwroot/namainvist.com/src/app/master && mkdir -p /www/wwwroot/namainvist.com/src/app/api/master', (err, stream) => {
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

                // Upload to root namainvist.com
                upload('/www/wwwroot/namainvist.com/src/app/master/page.tsx', files['src/app/master/page.tsx']);
                upload('/www/wwwroot/namainvist.com/src/app/api/master/route.ts', files['src/app/api/master/route.ts']);
                
                function runBuilds() {
                    const cmd = `
                        echo "Building namainvist.com..." &&
                        cd /www/wwwroot/namainvist.com && npm run build && pm2 restart namainvist_root --update-env &&
                        echo "✅ MASTER PANEL DEPLOYED"
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
