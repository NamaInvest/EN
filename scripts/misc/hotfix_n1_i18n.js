const { Client } = require('ssh2');

const file = {
    local: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\i18n.tsx',
    remoteDir: 'src/lib',
    remoteName: 'i18n.tsx'
};

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', async () => {
            let processes = [];
            try {
                const start = output.indexOf('[');
                const end = output.lastIndexOf(']') + 1;
                processes = JSON.parse(output.substring(start, end));
            } catch(e){}
            const n1 = processes.find(p => p.name === 'n1');
            if (!n1) return conn.end();

            const pmCwd = n1.pm2_env.pm_cwd;
            const rPath = `${pmCwd}/${file.remoteDir}/${file.remoteName}`;

            conn.sftp((sftpErr, sftp) => {
                sftp.fastPut(file.local, rPath, async errPut => {
                    if (errPut) throw errPut;
                    console.log(`[n1] I18n translation Hotfix uploaded! Rebuilding Next.js now...`);
                    
                    conn.exec(`cd ${pmCwd} && npm run build && pm2 restart n1`, (exErr, exStream) => {
                        exStream.on('data', d => console.log(d.toString().trim()));
                        exStream.on('close', () => {
                            console.log('✅ [n1] I18n translations updated cleanly!');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
