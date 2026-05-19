const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec('sudo -u postgres psql -h localhost -p 5432 -d n11_db -c "SELECT * FROM companies LIMIT 1;"', (err, stream) => { 
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -h localhost -p 5432 -d n1_db -c "SELECT * FROM companies LIMIT 1;"', (err2, stream2) => {
        stream2.on('data', d => process.stdout.write(d));
        stream2.stderr.on('data', d => process.stderr.write(d));
        stream2.on('close', () => conn.end());
      });
    });
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
