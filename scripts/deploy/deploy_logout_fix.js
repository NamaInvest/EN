const { Client } = require('ssh2');
const fs = require('fs');

const files = {
    'Sidebar.tsx': fs.readFileSync('src/components/Sidebar.tsx', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('Deploying Logout Fix to n1...');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const upload = (path, content) => new Promise((resolve) => {
            const writeStream = sftp.createWriteStream(path);
            writeStream.write(content);
            writeStream.end();
            writeStream.on('close', resolve);
        });

        async function orchestrate() {
            try {
                // Node N1
                await upload('/www/wwwroot/tenant_n1/src/components/Sidebar.tsx', files['Sidebar.tsx']);
                await upload('/www/wwwroot/namainvist.com/src/components/Sidebar.tsx', files['Sidebar.tsx']);

                const execCmd = `
                    cd /www/wwwroot/tenant_n1 && npm run build && pm2 restart n1 --update-env &&
                    cd /www/wwwroot/namainvist.com && npm run build && pm2 restart namainvist_root --update-env &&
                    echo "✅ LOGOUT FIX DEPLOYED"
                `;
                conn.exec(execCmd, (err, execStream) => {
                    if (err) throw err;
                    execStream.on('close', () => conn.end())
                              .on('data', data => console.log(data.toString()))
                              .stderr.on('data', data => console.error(data.toString()));
                });
            } catch (e) {
                console.error(e);
            }
        }
        
        orchestrate();
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
