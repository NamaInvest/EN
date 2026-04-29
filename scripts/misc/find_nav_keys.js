const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Check ALL tsx files for useTranslation + sys.str_9/10/11/12/13/14
    conn.exec("grep -n \"sys.str_9'\\|sys.str_10'\\|sys.str_11'\\|sys.str_12'\\|sys.str_13'\\|sys.str_14'\\|sys.str_32'\\|sys.str_33'\\|sys.str_34'\" /www/wwwroot/namainvist.com/src/ -r 2>&1", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('FILES with sys.str_9..34:');
            console.log(out || '(NONE)');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
