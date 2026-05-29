const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const conn = new Client();

const setupCommands = [
    `rm -f ~/.npmrc`,
    `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24 && npm i -g pm2`,
    `export DEBIAN_FRONTEND=noninteractive && dpkg --configure -a --force-confdef --force-confold || true`,
    `apt update`,
    `DEBIAN_FRONTEND=noninteractive apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" postgresql postgresql-contrib nginx`,
    // Setup PostgreSQL
    `sudo -u postgres psql -c "CREATE DATABASE n1_db;" || true`,
    `sudo -u postgres psql -c "CREATE USER n1_db WITH PASSWORD 'n1_pass123';" || true`,
    `sudo -u postgres psql -c "ALTER ROLE n1_db SET client_encoding TO 'utf8';"`,
    `sudo -u postgres psql -c "ALTER ROLE n1_db SET default_transaction_isolation TO 'read committed';"`,
    `sudo -u postgres psql -c "ALTER ROLE n1_db SET timezone TO 'UTC';"`,
    `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE n1_db TO n1_db;"`,
    `sudo -u postgres psql -d n1_db -c "GRANT ALL ON SCHEMA public TO n1_db;" || true`,
    // Ensure postgres can be connected to locally
    `echo "host n1_db n1_db 127.0.0.1/32 md5" >> /etc/postgresql/*/main/pg_hba.conf || true`,
    `systemctl restart postgresql`,
    // Prepare app directory
    `mkdir -p /www/wwwroot/n1.namainvist.com`
];

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    let index = 0;

    const executeNext = () => {
        if (index >= setupCommands.length) {
            console.log('All setup commands executed successfully.');
            conn.end();
            return;
        }

        const cmd = setupCommands[index];
        console.log(`Executing [${index + 1}/${setupCommands.length}]: ${cmd}`);
        
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                console.log(`Command finished with code: ${code}`);
                index++;
                executeNext();
            });
        });
    };

    executeNext();
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({
    host: hostIp, 
    port: 22, 
    username: 'root', 
    password: 'process.env.SSH_PASSWORD', 
    keepaliveInterval: 10000
});
