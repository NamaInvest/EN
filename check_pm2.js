const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec('pm2 jlist', (err, stream) => { 
    let out=''; 
    stream.on('data', d => out+=d).on('close', () => { 
      try { 
        const p = JSON.parse(out); 
        p.forEach(proc => { 
          if(proc.name==="n2-main") console.log(proc.name, proc.pm2_env.pm_cwd); 
        }); 
      } catch(e){} 
      conn.end(); 
    }); 
  }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
