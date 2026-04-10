const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`curl -H "Host: n11.namainvist.com" http://127.0.0.1/login`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
