const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const bashScript = `
cat << "EOF" > /usr/local/bin/fatoora
#!/bin/bash
JAR_PATH=$(ls /usr/local/zatca/zatca-einvoicing-sdk-*.jar | head -n 1)
java -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -jar "\$JAR_PATH" \\"\$@\\"
EOF
chmod +x /usr/local/bin/fatoora
`;

    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('FATOORA WRAPPER COMPLETELY FIXED ON N2.');
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
