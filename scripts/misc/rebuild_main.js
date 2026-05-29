const { Client } = require('ssh2');
new Client().on('ready', function() {
    this.exec(`
rm -f /tmp/fin_main.flag /tmp/fin_err.flag
nohup bash -c 'cd /www/wwwroot/namainvist.com && npm run build > /tmp/fin_main.log 2>&1 && pm2 restart main-site && touch /tmp/fin_main.flag || touch /tmp/fin_err.flag' &
echo "PID: $!"
    `, (e, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => this.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });

let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
if [ -f /tmp/fin_main.flag ]; then echo "DONE"; pm2 list | grep main
elif [ -f /tmp/fin_err.flag ]; then echo "FAILED"; tail -12 /tmp/fin_main.log
else echo "Building... (${tries*15}s)"; tail -2 /tmp/fin_main.log 2>/dev/null; fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if (out.includes('DONE') || out.includes('FAILED') || tries >= 40) return;
                setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
};
setTimeout(poll, 20000);
