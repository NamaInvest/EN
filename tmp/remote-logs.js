const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
  readyTimeout: 20000
};

conn.on('ready', () => {
  console.log('SSH connection established');
  conn.exec('pm2 logs --lines 30 --nostream', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('SSH error:', err);
}).connect(config);
