const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  conn.exec('cd /var/www/namasoft && ls -la src/app/api/banks/ && ls -la "src/app/(dashboard)/accounting/banks/" && npm run build 2>&1 | tail -80', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Exit code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '185.197.195.202',
  port: 22,
  username: 'root',
  password: 'VmJUML2LuezRSws'
});
