const { Client } = require('ssh2');

function inspect() {
    const conn = new Client();
    conn.on('ready', () => {
        const cmd = `cd /www/wwwroot/n1.namainvist.com && grep "bin_location" prisma/schema.prisma || echo "NOT_IN_SCHEMA" && sudo -u postgres psql -d n1_db -c "\\d products" | grep "bin_location" || echo "NOT_IN_DB"`;
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => console.log('STDOUT:\n', d.toString()));
            stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
            stream.on('close', () => conn.end());
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}
inspect();
