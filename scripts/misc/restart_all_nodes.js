const { Client } = require('ssh2');

const NODES = [
    { name: 'n11', pm2: 'n11' },
    { name: 'n1',  pm2: 'n1-main' },
    { name: 'n2',  pm2: 'n2' },
    { name: 'n3',  pm2: 'n3' },
    { name: 'n4',  pm2: 'n4' },
    { name: 'n5',  pm2: 'n5' },
    { name: 'n6',  pm2: 'n6' },
    { name: 'n7',  pm2: 'n7' },
    { name: 'n8',  pm2: 'n8' },
    { name: 'n9',  pm2: 'n9' },
    { name: 'n10', pm2: 'n10' },
];

const conn = new Client();
conn.on('ready', () => {
    // restart all errored nodes + check status
    const restartCmds = NODES.map(n => `pm2 restart ${n.pm2} 2>/dev/null`).join(' && ');
    const cmd = `${restartCmds} && sleep 3 && pm2 list 2>&1 | head -20`;
    
    conn.exec(cmd, (e, s) => {
        if (e) { console.log('error:', e.message); conn.end(); return; }
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
