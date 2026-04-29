const { Client } = require('ssh2');
const fs = require('fs');

const files = {
    'page.tsx': fs.readFileSync('src/app/page.tsx', 'utf8'),
    'login.tsx': fs.readFileSync('src/app/login/page.tsx', 'utf8'),
    'Sidebar.tsx': fs.readFileSync('src/components/Sidebar.tsx', 'utf8'),
    'SessionGuard.tsx': fs.readFileSync('src/components/SessionGuard.tsx', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('--- EMERGENCY ROLLBACK IN PROGRESS ---');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const uploadFile = (remotePath, localContent) => new Promise((resolve, reject) => {
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.write(localContent);
            writeStream.end();
            writeStream.on('close', resolve);
            writeStream.on('error', reject);
        });

        try {
            const dirN1 = '/www/wwwroot/n1.namainvist.com';
            const dirRoot = '/www/wwwroot/namainvist.com';

            console.log("Uploading restored files to N1 and Root...");
            await uploadFile(dirN1 + '/src/app/page.tsx', files['page.tsx']);
            await uploadFile(dirN1 + '/src/app/login/page.tsx', files['login.tsx']);
            await uploadFile(dirN1 + '/src/components/Sidebar.tsx', files['Sidebar.tsx']);
            await uploadFile(dirN1 + '/src/components/SessionGuard.tsx', files['SessionGuard.tsx']);

            await uploadFile(dirRoot + '/src/app/page.tsx', files['page.tsx']);
            await uploadFile(dirRoot + '/src/app/login/page.tsx', files['login.tsx']);
            await uploadFile(dirRoot + '/src/components/Sidebar.tsx', files['Sidebar.tsx']);
            await uploadFile(dirRoot + '/src/components/SessionGuard.tsx', files['SessionGuard.tsx']);

            const cmd = `
                echo "1. Destroying Root Node PM2 Process..."
                pm2 delete namainvist_root 2>/dev/null || true
                
                echo "2. Deleting Master Gateway Folder..."
                rm -rf ${dirRoot}/src/app/master
                
                echo "3. Restoring NGINX Monolithic Proxying to Port 3000..."
                chattr -i /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null
                sed -i 's/127.0.0.1:3005/127.0.0.1:3000/g' /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null
                sed -i 's/127.0.0.1:3001/127.0.0.1:3000/g' /www/server/panel/vhost/nginx/node_n1.conf 2>/dev/null
                sed -i 's/127.0.0.1:3001/127.0.0.1:3000/g' /www/server/panel/vhost/nginx/n1.namainvist.com.conf 2>/dev/null
                chattr +i /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null
                
                nginx -t && nginx -s reload
                
                echo "4. Hard-Building N1 Gateway..."
                fuser -k 3000/tcp 2>/dev/null || true
                cd ${dirN1} && npm run build && PORT=3000 pm2 restart n1 --update-env
                
                echo "✅ COMPLETE ROLLBACK TO PHASE 84 SUCCESSFUL."
            `;

            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => console.log('STDOUT:', d.toString()));
                stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
                stream.on('close', () => conn.end());
            });

        } catch (e) {
            console.error(e);
            conn.end();
        }
    });

}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
