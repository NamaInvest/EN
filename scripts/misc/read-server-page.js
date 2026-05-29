const { Client } = require('ssh2');
const fs = require('fs');

// Read the current page.tsx from the server and show it
function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  const content = await ssh('cat /www/wwwroot/namainvist.com/src/app/page.tsx');
  fs.writeFileSync('namainvist-page-server.tsx', content);
  console.log('File saved, first 500 chars:');
  console.log(content.substring(0, 500));
  console.log('\nTotal length:', content.length);
})();
