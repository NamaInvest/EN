const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  console.log('Connected to server. Uploading tar...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut('upload.tar', '/www/wwwroot/namainvist.com/upload.tar', err => {
      if (err) throw err;
      console.log('Upload complete. Extracting and building...');
      conn.exec('cd /www/wwwroot/namainvist.com && tar -xf upload.tar && npm run build && pm2 restart all', (err, stream) => { 
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          console.log('Done building and restarting.');
          conn.end();
        });
      }); 
    });
  });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
