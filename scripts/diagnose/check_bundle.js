const { Client } = require('ssh2');
const Client2 = require('ssh2').Client;
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    // Check what lang value is being read from the built JS bundle
    conn.exec(`grep -r "app_lang" /www/wwwroot/n2.namainvist.com/.next/server/ 2>/dev/null | head -5`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log('=== app_lang in built server files ===');
            console.log(data.substring(0, 2000));
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
