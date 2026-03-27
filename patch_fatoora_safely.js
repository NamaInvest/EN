const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `#!/bin/bash
JAR_PATH=$(find /usr/local/zatca -name '*zatca*.jar' | head -n 1)
java -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -jar "$JAR_PATH" "$@"
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const writeStream = sftp.createWriteStream('/usr/local/bin/fatoora');
        writeStream.write(scriptContent);
        writeStream.end();
        
        writeStream.on('close', () => {
            conn.exec('chmod +x /usr/local/bin/fatoora', (errChmod, stream) => {
                if (errChmod) throw errChmod;
                stream.on('close', () => {
                    console.log('✅ FATOORA CLI FLAWLESSLY PATCHED!');
                    conn.end();
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
