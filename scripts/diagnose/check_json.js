const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const scriptContent = `
const ar = require('/www/wwwroot/n11.namainvist.com/src/locales/ar.json');
console.log("sys.str_4294 =>", ar['sys.str_4294']);
  `;
  conn.exec(`node -e "${scriptContent.replace(/"/g, '\\"')}"`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
