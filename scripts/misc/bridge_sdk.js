const { Client } = require('ssh2');

const n1 = new Client();
const n2 = new Client();

console.log('🔗 Establishing Bridge Connection...');

n1.on('ready', () => {
    console.log('✅ Connected to N1 (Source).');
    n2.on('ready', () => {
        console.log('✅ Connected to N2 (Destination).');
        
        n2.exec('mkdir -p /usr/local/zatca', (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                n1.sftp((err1, sftp1) => {
                    if (err1) throw err1;
                    n2.sftp((err2, sftp2) => {
                        if (err2) throw err2;
                        
                        console.log('📥 Initiating direct byte-stream transfer of SDK Jar from N1 to N2...');
                        const readStream = sftp1.createReadStream('/usr/local/zatca/zatca-einvoicing-sdk-4.0.0.jar');
                        const writeStream = sftp2.createWriteStream('/usr/local/zatca/zatca-einvoicing-sdk-4.0.0.jar');
                        
                        readStream.pipe(writeStream);
                        
                        writeStream.on('close', () => {
                            console.log('🎉 SDK Transfer Complete!');
                            n1.end();
                            n2.end();
                        });
                        
                        readStream.on('error', e => console.log('Read Error:', e));
                        writeStream.on('error', e => console.log('Write Error:', e));
                    });
                });
            });
        });
        
    }).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
}).connect({host: '46.4.188.169', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
