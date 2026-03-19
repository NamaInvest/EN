const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Running search...');
    conn.exec("find / -name 'package.json' -type f | grep -v 'node_modules'", (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => { output += d.toString(); });
        stream.on('close', () => {
             console.log('Search Results:\n', output);
             conn.end();
        });
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({ 
    host: '185.197.195.202', 
    port: 22, 
    username: 'root', 
    password: 'VmJUML2LuezRSws',
    readyTimeout: 30000 
});
