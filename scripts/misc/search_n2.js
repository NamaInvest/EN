const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`grep -r "EN GB" /www/wwwroot/n2.namainvist.com/.next/static/chunks/`, (err, stream) => { 
    let out = '';
    stream.on('data', d => out+=d).on('close', () => { 
      require('fs').writeFileSync('n2_chunks_search.txt', out);
      console.log('Search complete: length', out.length);
      conn.end(); 
    }); 
  }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
