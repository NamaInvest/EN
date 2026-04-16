const fs = require('fs');
const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
  let settingsContent = '';
  c.exec('cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings/page.tsx', (err, stream) => {
    stream.on('data', d => settingsContent += d);
    stream.on('end', () => {
      fs.writeFileSync('tmp_settings.tsx', settingsContent);
      console.log('Settings downloaded');
      c.end();
    });
  });
}).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
