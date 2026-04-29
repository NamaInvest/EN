const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  console.log('? Connected! Uploading files...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const path1 = '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/page.tsx';
    const path2 = '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/company-info/page.tsx';
    
    sftp.fastPut('src/app/(dashboard)/settings/page.tsx', path1, (err) => {
      if (err) console.error(err);
      sftp.fastPut('src/app/(dashboard)/company-info/page.tsx', path2, (err) => {
        if (err) console.error(err);
        console.log('? Uploaded. Building...');
        conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
          if (err) throw err;
          stream.on('close', () => { console.log('Deployment Done!'); conn.end(); }).on('data', d => console.log(d.toString()));
        });
      });
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
