const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Restarting PM2 process for saas-app...');
  conn.exec('pm2 restart saas-app', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
