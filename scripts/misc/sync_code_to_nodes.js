const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const cmd = `
#!/bin/bash
set -e
for i in {1..10}; do
    if [ "$i" -ne 7 ]; then
        echo "Syncing code to N$i..."
        dir_path="/www/wwwroot/n\${i}.namainvist.com/"
        rsync -a --delete /www/wwwroot/n11.namainvist.com/src/app/api/branches/ \${dir_path}/src/app/api/branches/
        rsync -a --delete /www/wwwroot/n11.namainvist.com/.next/server/app/api/branches/ \${dir_path}/.next/server/app/api/branches/
        
        if [ "$i" -eq 1 ]; then
            pm2 restart nama-main >> /dev/null
        else
            pm2 restart "n\${i}-main" >> /dev/null
        fi
        echo "Restarted N$i"
    fi
done
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
