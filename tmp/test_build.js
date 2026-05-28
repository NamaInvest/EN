const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    console.log('CONNECTED TO FLEET SERVER successfully. Starting build...');
    conn.exec('cd /www/wwwroot/namainvist.com && npm run build', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()))
              .on('close', (code) => {
                  console.log(`\nBuild exited with code: ${code}`);
                  conn.end();
                  if (code !== 0) process.exit(1);
              });
    });
}).connect(SERVER);
