const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`grep -ri proxy_pass /www/server/panel/vhost/nginx/`, (err, stream) => { 
    let out = '';
    stream.on('data', d => out+=d).on('close', () => { 
      require('fs').writeFileSync('proxy_ports.txt', out);
      conn.end(); 
    }); 
  }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
