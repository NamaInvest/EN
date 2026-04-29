const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check what the PREBUILT dashboard HTML actually contains
    const cmd = `cat /www/wwwroot/n2.namainvist.com/.next/server/app/dashboard.html | grep -o 'sidebar.section.*"' | head -20`;
    conn.exec(cmd, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log('=== Dashboard HTML sidebar keys ===');
            console.log(data || 'NONE FOUND');
            
            // Also check if the English text is there
            conn.exec(`cat /www/wwwroot/n2.namainvist.com/.next/server/app/dashboard.html | grep -o 'Sales & POS\\|POS Terminal\\|المبيعات\\|sidebar.item' | head -20`, (err2, stream2) => {
                let data2 = '';
                stream2.on('data', d => data2 += d);
                stream2.on('close', () => {
                    console.log('=== Sidebar text in HTML ===');
                    console.log(data2 || 'NONE FOUND');
                    conn.end();
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
