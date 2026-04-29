const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Fetching PM2 logs...');
  conn.exec('pm2 logs main-site --lines 50 --nostream', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
  readyTimeout: 30000
});
