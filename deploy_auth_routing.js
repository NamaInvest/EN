const { Client } = require('ssh2');
const fs = require('fs');

const files = {
    'src/app/page.tsx': fs.readFileSync('src/app/page.tsx', 'utf8'),
    'src/app/login/page.tsx': fs.readFileSync('src/app/login/page.tsx', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('Deploying Auth Routing updates to Cluster Node Array...');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let pending = 0;
        const upload = (path, content) => {
            pending++;
            const stream = sftp.createWriteStream(path);
            stream.write(content);
            stream.end();
            stream.on('close', () => {
                pending--;
                if (pending === 0) runBuilds();
            });
        };

        // Upload to n1
        upload('/www/wwwroot/n1.namainvist.com/src/app/page.tsx', files['src/app/page.tsx']);
        upload('/www/wwwroot/n1.namainvist.com/src/app/login/page.tsx', files['src/app/login/page.tsx']);
        
        // Upload to root namainvist.com
        upload('/www/wwwroot/namainvist.com/src/app/page.tsx', files['src/app/page.tsx']);
        upload('/www/wwwroot/namainvist.com/src/app/login/page.tsx', files['src/app/login/page.tsx']);
        
        function runBuilds() {
            const cmd = `
                echo "Building n1..." &&
                cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1 --update-env &&
                echo "Building namainvist.com..." &&
                cd /www/wwwroot/namainvist.com && npm run build && pm2 restart namainvist_root --update-env &&
                echo "✅ ALL DONE"
            `;
            conn.exec(cmd, (err, stream) => {
                if (err) throw err;
                stream.on('close', () => conn.end())
                      .on('data', data => console.log(data.toString()))
                      .stderr.on('data', data => console.error(data.toString()));
            });
        }
    });

}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
