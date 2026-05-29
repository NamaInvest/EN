const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sed -i "s/-Djdk.module.illegalAccess=deny //g" /opt/zatca-einvoicing-sdk-238-R3.4.8/Apps/fatoora && sed -i "s/-Djdk.module.illegalAccess=deny //g" /opt/zatca-einvoicing-sdk-238-R3.4.8/install.bat && sed -i "s/-Djdk.module.illegalAccess=deny //g" /opt/zatca-einvoicing-sdk-238-R3.4.8/install.sh', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('ZATCA Java SDK Patched for JDK 21 on Hetzner!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
