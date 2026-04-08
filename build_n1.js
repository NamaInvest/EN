const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    const buildCmd = `
        export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24
        cd /www/wwwroot/n1.namainvist.com
        echo "BUILD START"
        npm run build > build_new.log 2>&1
        echo "BUILD DONE"
        pm2 restart nama-main
        echo "RESTART FINISHED"
    `;
    conn.exec(buildCmd, (err, stream) => { 
        if (err) throw err; 
        stream.on('data', d => process.stdout.write(d.toString())); 
        stream.stderr.on('data', d => process.stderr.write(d.toString())); 
        stream.on('close', () => conn.end()); 
    }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
