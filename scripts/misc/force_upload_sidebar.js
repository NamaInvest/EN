const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Uploading Sidebar.tsx to N11...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localFile = 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\Sidebar.tsx';
        const remoteFile = '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx';
        
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('✅ Uploaded Sidebar.tsx');
            
            // Edit the module property
            const fixScript = `
const fs = require('fs');
const p = '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx';
let sb = fs.readFileSync(p, 'utf8');
sb = sb.replace("module: 'reports' },", "module: 'purchases' },");
fs.writeFileSync(p, sb, 'utf8');
console.log('Fixed reports to purchases in Sidebar');
`;
            sftp.fastPut(Buffer.from(fixScript, 'utf8'), '/tmp/fix_sb.js', (err) => {
                if(err) throw err;
                conn.exec('node /tmp/fix_sb.js && cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                    stream.on('close', () => {
                        conn.end();
                        console.log('🏁 Build restarting.');
                    }).on('data', (d) => process.stdout.write(d.toString()))
                      .stderr.on('data', (d) => process.stderr.write(d.toString()));
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
