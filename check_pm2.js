const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`cat /root/ecosystem.config.js | grep n11 -A 5`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
