const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const buildCmd = `
        echo "Restarting ALL instances and workers with --update-env..."
        for i in {1..10}; do
            pm2 restart n$i --update-env || true
            pm2 restart n$i-whatsapp --update-env || true
        done
        echo "Done!"
    `;
    conn.exec(buildCmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
