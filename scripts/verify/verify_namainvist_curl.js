const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('curl -s https://namainvist.com', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => { out += d.toString(); });
    stream.on('close', () => {
      console.log('Includes sys.str_9?', out.includes('sys.str_9'));
      console.log('Includes Mجمُوعة?', out.includes('مجموعة الأنظمة'));
      conn.end();
    });
  });
}).connect({
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: 'process.env.SSH_PASSWORD'
});
