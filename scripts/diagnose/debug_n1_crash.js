const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to N1. Fetching logs...');
    
    // Check both potential log files
    const cmd = "echo '--- push_all_fixes (build_api.log) ---' && tail -n 50 /www/wwwroot/n1.namainvist.com/build_api.log 2>/dev/null || echo 'Not found' && echo '--- phase14 (tmp) ---' && tail -n 50 /tmp/build_n1.namainvist.com.log 2>/dev/null || echo 'Not found'";
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', data => process.stdout.write(data.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', err => {
    console.error('SSH Error:', err);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 10000
});
