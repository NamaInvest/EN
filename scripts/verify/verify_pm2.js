const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const cmd = `pm2 jlist`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
            try {
                const processes = JSON.parse(data);
                const target = processes.find(p => p.name === 'nama-landing');
                if (target) {
                    console.log('nama-landing pm_cwd:', target.pm2_env.pm_cwd);
                } else {
                    console.log('nama-landing NOT FOUND in pm2!');
                }
            } catch(e) { console.log('Failed to parse:', e.message); }
            conn.end();
        });
        stream.on('data', d => data += d.toString());
    });
}).on('error', console.error).connect(config);
