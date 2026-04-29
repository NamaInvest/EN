const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');

console.log('🔄 Initiating direct SFTP upload of ZATCA SDK v4.0.0 to N2 (46.4.188.170)...');

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localZip = 'c:/Users/1/Desktop/alfa/zatca-sdk-v4.zip';
        const remoteZip = '/usr/local/zatca-sdk-v4.zip';
        
        if (!fs.existsSync(localZip)) {
            console.log('❌ FATAL: localZip not found!');
            conn.end(); return;
        }

        console.log('📤 Uploading 67MB Archive... (This may take roughly 30-60 seconds)');
        
        sftp.fastPut(localZip, remoteZip, (errPut) => {
            if (errPut) throw errPut;
            console.log('✅ Upload Complete! Extracting and configuring SDK on N2...');
            
            const bashScript = `
apt-get update && apt-get install -y unzip jq default-jre
cd /usr/local
rm -rf zatca
mkdir -p zatca
unzip -o zatca-sdk-v4.zip -d zatca/
rm zatca-sdk-v4.zip

# Create infallible fatoora bash wrapper
cat << "EOF" > /usr/local/bin/fatoora
#!/bin/bash
JAR_PATH=\\$(find /usr/local/zatca -name "*zatca*.jar" | head -n 1)
if [ -z "\\$JAR_PATH" ]; then
    echo "Error: ZATCA SDK JAR not found in /usr/local/zatca/"
    exit 1
fi
java -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -jar "\\$JAR_PATH" "\\$@"
EOF
chmod +x /usr/local/bin/fatoora

echo "🎉 SDK FULLY INSTALLED AND PATCHED ON N2!"
`;
            conn.exec(bashScript, (errExec, stream) => {
                if (errExec) throw errExec;
                stream.on('close', () => {
                    console.log('✅ Everything is ready.');
                    conn.end();
                }).on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stdout.write('ERR: ' + d.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
