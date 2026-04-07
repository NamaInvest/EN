const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        if (err) throw err;
        stream.on('close', () => {
            try {
                const start = output.indexOf('[');
                const end = output.lastIndexOf(']') + 1;
                const processes = JSON.parse(output.substring(start, end));
                
                let results = processes
                    .filter(p => !!p.name.match(/^n\d+(-main)?$/) || p.name === 'nama-main' || p.name === 'n2')
                    .map(p => ({
                        name: p.name,
                        status: p.pm2_env.status,
                        restarts: p.pm2_env.restart_time,
                        memory: (p.monit.memory / 1024 / 1024).toFixed(1) + ' MB'
                    }))
                    .sort((a,b) => {
                        let na = parseInt(a.name.replace('-main','').replace('n','')) || (a.name==='nama-main'?1:0);
                        let nb = parseInt(b.name.replace('-main','').replace('n','')) || (b.name==='nama-main'?1:0);
                        return na - nb;
                    });
                
                console.table(results);
            } catch(e) {
                console.error("Parse error:", e);
            }
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
