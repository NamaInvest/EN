const { Client } = require('ssh2');

const conn = new Client();
const targetDir = '/www/wwwroot/n1.namainvist.com';

conn.on('ready', () => {
    console.log('Connected to n1 Server');
    
    const cmds = `
        export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24
        cd ${targetDir}
        echo "Installing react-hot-toast..."
        npm install react-hot-toast qrcode.react --legacy-peer-deps
        echo "Rebuilding Next.js Application..."
        npm run build
        echo "Restarting PM2 Service..."
        pm2 restart n1
    `;

    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log('Build fixed! Exit code:', code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });

}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 20000
});
