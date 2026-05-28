const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    // Move legacy files outside the Next.js workspace completely to /www/wwwroot/namainvest_legacy_root_files
    const cmd = `
        mkdir -p /www/wwwroot/namainvest_legacy_root_files && \
        mv /www/wwwroot/namainvist.com/backups/legacy-root-files/* /www/wwwroot/namainvest_legacy_root_files/ 2>/dev/null || true && \
        rm -rf /www/wwwroot/namainvist.com/backups/legacy-root-files
    `;
    
    console.log(`Running Command:\n${cmd}\n`);
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()))
              .on('close', (code) => {
                  console.log(`\nCommand exited with code: ${code}`);
                  conn.end();
              });
    });
}).connect(SERVER);
