const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('grep -c "104" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>&1', (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Lines with 104:', out.trim());
      // Also check for old content
      c.exec('grep -c "73" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>&1', (e2, s2) => {
        let o2 = '';
        s2.on('data', d => o2 += d);
        s2.on('close', () => {
          console.log('Lines with 73:', o2.trim());
          // Get file size
          c.exec('wc -c /www/wwwroot/namainvist.com/.next/server/app/index.html', (e3, s3) => {
            let o3 = '';
            s3.on('data', d => o3 += d);
            s3.on('close', () => { console.log('File size:', o3.trim()); c.end(); });
          });
        });
      });
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
