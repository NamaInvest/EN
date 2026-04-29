const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.sftp((err, sftp) => {
    sftp.readFile('/www/wwwroot/n2.namainvist.com/src/components/LanguageSwitcher.tsx', 'utf8', (err, data) => {
      require('fs').writeFileSync('n2_ls.tsx', data);
      conn.end();
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
