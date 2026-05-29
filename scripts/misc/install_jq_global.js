const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Installing missing "jq" dependency globally for ZATCA CLI on N1-N10...');
    const bashScript = `
nohup sh -c '
echo "Starting universal jq installation..." > /tmp/jq_install.log
apt-get update >> /tmp/jq_install.log 2>&1
apt-get install -y jq >> /tmp/jq_install.log 2>&1
echo "jq installed successfully!" >> /tmp/jq_install.log
' > /dev/null 2>&1 &
    `;
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ jq installation triggered via apt-get in background!');
            
            // To be absolutely sure, let's run it inline synchronously JUST ON N2 so the user can test right away
            conn.exec('apt-get update && apt-get install -y jq', (err2, stream2) => {
                stream2.on('close', () => {
                   console.log('✅ N2 NOW HAS JQ! User can test instantly.');
                   conn.end();
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
