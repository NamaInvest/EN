const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('sudo -u postgres psql -d namadb -c "SELECT id, name_ar FROM \\"Module\\" WHERE name_ar LIKE \'%وحدات%\' OR name_ar LIKE \'%طھ%\' LIMIT 5;"', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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
  password: '_ee4SWbxLVfH9b'
});
