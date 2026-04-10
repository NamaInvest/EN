const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`node -e "const http = require('http'); http.get('http://127.0.0.1:3011/reports', res => { let body=''; res.on('data', c => body += c); res.on('end', () => { console.log('HTML sys:', body.includes('sys.str_4294')); console.log('HTML Arabic text:', body.includes('ملخص يومي للمبيعات')); }); });"`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
