const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    // 1. Read existing .env
    conn.exec('cat /www/wwwroot/n11.namainvist.com/.env', (err, stream) => {
        if (err) throw err;
        let envContent = '';
        stream.on('data', d => envContent += d.toString());
        stream.on('close', () => {
            // 2. Modify .env
            let newEnv = envContent;
            
            // Fix PORT
            if (newEnv.includes('PORT=')) {
                newEnv = newEnv.replace(/PORT=\d+/, 'PORT=3011');
            } else {
                newEnv += '\\nPORT=3011\\n';
            }
            
            // Fix Database URL to use independent one
            if (newEnv.includes('DATABASE_URL=')) {
                // Example: mysql://root:pass@localhost:3306/old_db
                // Let's replace the db name with n11_db
                newEnv = newEnv.replace(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/, (match, user, pass, host, port, db) => {
                    return `mysql://${user}:${pass}@${host}:${port}/n11_db`;
                });
            }

            console.log('--- NEW .env ---');
            console.log(newEnv);
            console.log('--- END ENV ---');

            // 3. Write back and restart
            const scriptStr = `cat << 'EOF' > /www/wwwroot/n11.namainvist.com/.env\n${newEnv}\nEOF\n` + 
                              `cd /www/wwwroot/n11.namainvist.com && pm2 restart n11`;

            conn.exec(scriptStr, (err2, stream2) => {
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.on('close', () => conn.end());
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
