const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`cat /www/server/panel/vhost/nginx/n2.namainvist.com.conf`, (err, stream) => { 
    let out = '';
    stream.on('data', d => out+=d).on('close', () => { 
      require('fs').writeFileSync('n2_nginx.conf', out);
      conn.end(); 
    }); 
  }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
