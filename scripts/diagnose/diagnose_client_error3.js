const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    // Check what nginx proxies to
    'echo "---NGINX---" && cat /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null | head -40',
    // Check if port 2999 or 3000 is listening
    'echo "---PORTS---" && ss -tlnp | grep -E "2999|3000"',
    // Curl both ports
    'echo "---CURL 3000---" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null',
    'echo "---CURL 2999---" && curl -s -o /dev/null -w "%{http_code}" http://localhost:2999/ 2>/dev/null',
    // Check sign-in via correct port  
    'echo "---CURL SIGN-IN 3000---" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sign-in 2>/dev/null',
    // Get the actual response for sign-in
    'echo "---SIGN-IN BODY---" && curl -s http://localhost:3000/sign-in 2>/dev/null | head -5',
    // Check nginx error log
    'echo "---NGINX ERR---" && tail -20 /www/server/panel/vhost/logs/namainvist.com.error.log 2>/dev/null || tail -20 /www/wwwlogs/namainvist.com.error.log 2>/dev/null || echo "No nginx error log found"',
    // Check ecosystem or pm2 startup command
    'echo "---PM2 SHOW---" && pm2 show main-site 2>/dev/null | grep -E "script|args|cwd|port|mode|env"',
  ];
  conn.exec(cmds.join(' && echo "======" && '), (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.on('error', (err) => console.error('SSH err:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
