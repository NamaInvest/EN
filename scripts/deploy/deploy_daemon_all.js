const { Client } = require('ssh2');
const fs = require('fs');

async function deployDaemonAll() {
    console.log("🚀 Distributing Phase 89 Automation Daemon to N2-N10...");

    const localContent = fs.readFileSync('automation_daemon.js', 'utf8');

    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);

                try {
                    for(let i = 2; i <= 10; i++) {
                        const rootPath = `/www/wwwroot/n${i}.namainvist.com`;
                        const remotePath = `${rootPath}/automation_daemon.js`;
                        
                        console.log(`📡 Uploading to tenant n${i}...`);
                        
                        await new Promise((res, rej) => {
                            const stream = sftp.createWriteStream(remotePath);
                            stream.write(localContent);
                            stream.end();
                            stream.on('close', res);
                            stream.on('error', rej);
                        });
                        console.log(`✅ Uploaded to tenant n${i}.`);
                    }

                    console.log("\\n🔄 Bootstrapping PM2 daemons for N2-N10...");
                    const pm2Cmd = [
                        'for i in {2..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    pm2 delete automation_daemon_n$i 2>/dev/null || true;',
                        '    pm2 start automation_daemon.js --name "automation_daemon_n$i";',
                        '  )',
                        'done && pm2 save'
                    ].join(' ');

                    conn.exec(pm2Cmd, (execErr, stream) => {
                        if (execErr) throw execErr;
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => {
                            console.log("🎉 Successfully deployed Automation Daemons to all tenant nodes!");
                            conn.end();
                            resolve();
                        });
                    });

                } catch (e) {
                    console.error('SFTP/Upload Phase Error:', e);
                    conn.end();
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170', 
            port: 22, 
            username: 'root', 
            password: '_ee4SWbxLVfH9b', 
            readyTimeout: 20000
        });
    });
}

deployDaemonAll().catch(e => console.error("Critical Failure:", e));
