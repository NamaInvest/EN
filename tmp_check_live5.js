const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Find pm_cwd from pm2
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
            let pmCwd = '';
            try {
                const jsonStart = output.indexOf('[');
                const jsonEnd = output.lastIndexOf(']') + 1;
                const processes = JSON.parse(output.substring(jsonStart, jsonEnd));
                const n1 = processes.find(p => p.name === 'n1');
                if (n1) pmCwd = n1.pm2_env.pm_cwd;
            } catch(e) {}
            
            if (!pmCwd) { console.log('not found pmcwd'); conn.end(); return; }
            
            conn.exec(`cat ${pmCwd}/src/lib/i18n.tsx | grep "sidebar.section.dashboard"`, (err2, stream2) => {
                stream2.pipe(process.stdout);
                stream2.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
