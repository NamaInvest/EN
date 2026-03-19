const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const baseDir = '/var/www/namasoft';
    console.log('Running Next Build and Capturing Logs...');
    
    // Command sequence: run build and dump log if failed
    const script = `
        cd ${baseDir}
        npm run build > build_output.log 2>&1
        cat build_output.log
    `;
    
    conn.exec(script, { pty: true }, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\nProcess Exited! Code:', code);
            conn.end();
            process.exit(code || 0);
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
