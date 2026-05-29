const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('pm2 restart main-site && sleep 4 && curl -s https://namainvist.com/ | grep -o "104" | head -3', (e, s) => {
    let o = '';
    s.on('data', d => { o += d; process.stdout.write(d.toString()); });
    s.on('close', () => { console.log('\n\n"104" count:', (o.match(/104/g)||[]).length); c.end(); });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
