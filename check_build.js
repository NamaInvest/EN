const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /tmp/rebuild_modules_status.txt 2>/dev/null; echo "---"; tail -20 /tmp/rebuild_modules.log 2>/dev/null', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => { console.log('EXIT:', code); conn.end(); })
      .on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
}).connect({ host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws' });
