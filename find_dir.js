const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to server...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const cmd = 'cd /var/www/namasoft && ls -la .git || echo "Not a git repo"';
  console.log(`Executing: ${cmd}`);
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code) => {
      console.log('Finished with code ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '185.197.195.202',
  port: 22,
  username: 'root',
  password: 'VmJUML2LuezRSws'
});
