const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec("pm2 jlist", (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => { output += d.toString(); });
        stream.on('close', () => {
             try {
                const list = JSON.parse(output);
                list.forEach(p => console.log(p.name, p.pm2_env.pm_cwd));
             } catch(e) {
                console.log('Plain output:', output);
             }
             conn.end();
        });
    });
}).connect({ 
    host: '185.197.195.202', 
    port: 22, 
    username: 'root', 
    password: 'VmJUML2LuezRSws',
    readyTimeout: 30000 
});
