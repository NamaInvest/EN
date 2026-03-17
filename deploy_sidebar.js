const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  conn.exec('cd /var/www/namasoft && nohup bash -c "npm run build > /tmp/rebuild_sidebar.log 2>&1 && pm2 restart namasoft && echo DONE > /tmp/rebuild_sidebar_status.txt" > /dev/null 2>&1 &', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Build kicked off! EXIT: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    });
  });
}).connect({
  host: '185.197.195.202',
  port: 22,
  username: 'root',
  password: 'VmJUML2LuezRSws'
});
