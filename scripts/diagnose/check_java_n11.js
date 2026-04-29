const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Checking ZATCA Java SDK... ');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -l /opt/zatca-einvoicing-sdk-238-R3.4.8/Apps && ls -l "/tmp/zatca-workspace" && ls -l "/opt/zatca-einvoicing-sdk-238-R3.4.8/Data"', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
