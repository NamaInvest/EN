const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- FETCHING ZATCA SDK DIRECTLY TO N2 FROM N1 ---');
    const bashScript = `
apt-get update && apt-get install -y sshpass
sshpass -p "M9_4G7eCqZtU2nVh" scp -o StrictHostKeyChecking=no -r root@46.4.188.169:/usr/local/zatca /usr/local/zatca
echo "#!/bin/bash" > /usr/local/bin/fatoora
echo "JAR_PATH=\\$(ls /usr/local/zatca/zatca-einvoicing-sdk-*.jar | head -n 1)" >> /usr/local/bin/fatoora
echo "java -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -jar \\"\\$JAR_PATH\\" \\"\\$@\\"" >> /usr/local/bin/fatoora
chmod +x /usr/local/bin/fatoora
echo "ZATCA SDK MIRRORED ON N2 SUCCESSFULLY!"
`;
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
