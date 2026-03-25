const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- DIAGNOSING NEW EXTERNAL IP & DNS ---');
    
    const cmd = \`
        echo "1. Resolving namainvist.com..."
        ping -c 1 namainvist.com | head -n 2
        
        echo "\\n2. Curlling 204.168.144.74/api/auth/session..."
        curl -s -I http://204.168.144.74/api/auth/session
        
        echo "\\n3. Curlling 204.168.144.74 Dashboard..."
        curl -s -I http://204.168.144.74/dashboard
    \`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
