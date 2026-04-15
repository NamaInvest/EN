const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const conn = new Client();
conn.on('ready', () => {
    const cmds = [1,2,3,4,5,6,7,8,9,10].map(i => 
        `echo -n "N${i}: " && stat -c "%y" /www/wwwroot/n${i}.namainvist.com/.next/BUILD_ID 2>/dev/null || echo "NO_BUILD"`
    ).join('; ');
    conn.exec(cmds, (err, stream) => {
        stream.on('close', () => conn.end())
            .on('data', d => process.stdout.write(d.toString()))
            .stderr.on('data', d => {});
    });
}).connect(config);
