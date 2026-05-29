const { Client } = require('ssh2');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut('c:\\Users\\1\\Desktop\\alfa\\src\\app\\page.tsx', '/www/wwwroot/namainvist.com/src/app/page.tsx', (err) => {
            if (err) throw err;
            console.log('Successfully uploaded perfect hardcoded page.tsx to nama-landing!');
            
            conn.exec('nohup sh -c "cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build && pm2 restart nama-landing" > /www/wwwroot/nama_landing_fix.log 2>&1 &', (err, stream) => {
                if (err) throw err;
                console.log('Triggered nama-landing full rebuild and restart in background!');
                setTimeout(() => conn.end(), 1000);
            });
        });
    });
}).on('error', console.error).connect(config);
