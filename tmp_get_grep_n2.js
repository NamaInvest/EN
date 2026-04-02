const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -lr "MUKHTAR" /www/wwwroot/n2.namainvist.com/.next/static/chunks/', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
            const fs = require('fs');
            fs.writeFileSync('d:\\namasoft9-3-main\\tmp_grep_mukhtar.txt', out);
            console.log("Saved grep to tmp_grep_mukhtar.txt");
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
