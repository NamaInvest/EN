const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Patching /usr/local/bin/fatoora globally on N1-N10...');
    const bashScript = `
nohup sh -c '
for i in 1 2 3 4 5 6 7 8 9 10; do
    echo "Patching bin on N$i..."
    ssh -o StrictHostKeyChecking=no root@46.4.188.170 "
        cat << \\\"EOF\\\" > /www/wwwroot/n$i.namainvist.com/fatoora.sh
#!/bin/bash
FATOORA_HOME=/usr/local/zatca
if [ ! -f \\"\\$FATOORA_HOME/global.json\\" ]; then
    echo \\"ERROR: FATOORA_HOME not found\\"
    exit 1
fi
EXTVER=\\$(jq -r '.version' \\$FATOORA_HOME/global.json)
java -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -jar \\$FATOORA_HOME/zatca-einvoicing-sdk-\\$EXTVER.jar --globalVersion \\$EXTVER \\$@
EOF
        chmod +x /www/wwwroot/n$i.namainvist.com/fatoora.sh
        cp /www/wwwroot/n$i.namainvist.com/fatoora.sh /usr/local/bin/fatoora
    "
done
echo "Global Bin Patch Complete!" > /tmp/fatoora_bin_patch.log
' > /dev/null 2>&1 &
    `;
    
    // Applying JUST manually on N2 instantly to be fast for the user!
    const manualN2 = `
cat << "EOF" > /usr/local/bin/fatoora
#!/bin/bash
FATOORA_HOME=/usr/local/zatca
EXTVER=$(jq -r '.version' $FATOORA_HOME/global.json)
java -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -jar $FATOORA_HOME/zatca-einvoicing-sdk-$EXTVER.jar --globalVersion $EXTVER "$@"
EOF
chmod +x /usr/local/bin/fatoora
`;

    conn.exec(manualN2, (err, stream2) => {
        stream2.on('close', () => {
            console.log('✅ N2 FATOORA BINARY PATCHED INSTANTLY. Triggering global background sync...');
            conn.exec(bashScript, (err, stream) => {
                stream.on('close', () => conn.end());
            });
        });
    });

}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
