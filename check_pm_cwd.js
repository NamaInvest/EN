const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = "";
        stream.on('data', d => output += d);
        stream.on('close', () => {
            try {
                const processes = JSON.parse(output);
                const main = processes.find(p => p.name === 'nama-main');
                console.log("PM_CWD for nama-main: ", main ? main.pm2_env.pm_cwd : "NOT FOUND");
                console.log("SERVER PORT: ", main ? main.pm2_env.PORT : "NOT FOUND");
            } catch(e) {
                console.log("Error parsing JSON:", e.message);
                console.log(output.substring(0, 500));
            }
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
