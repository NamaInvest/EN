const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Running build...');
  conn.exec('cd /www/wwwroot/namainvist.com && npm run build', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Build exited with code ' + code);
      if (code === 0) {
         conn.exec('pm2 restart main-site', (e, s) => {
            s.on('close', () => conn.end());
         });
      } else {
         conn.end();
      }
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
  readyTimeout: 30000
});
