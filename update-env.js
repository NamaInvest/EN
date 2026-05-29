const {Client} = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    const cmd = `
        sed -i 's/# PROVISION_SSH_HOST=/PROVISION_SSH_HOST=127.0.0.1/g; s/# PROVISION_SSH_USER=/PROVISION_SSH_USER=root/g; s/# PROVISION_SSH_PASS=/PROVISION_SSH_PASS=process.env.SSH_PASSWORD/g' /www/wwwroot/namainvist.com/.env || true
        sed -i 's/# PROVISION_SSH_HOST=/PROVISION_SSH_HOST=127.0.0.1/g; s/# PROVISION_SSH_USER=/PROVISION_SSH_USER=root/g; s/# PROVISION_SSH_PASS=/PROVISION_SSH_PASS=process.env.SSH_PASSWORD/g' /www/wwwroot/n1.namainvist.com/.env || true
        sed -i 's/# PROVISION_SSH_HOST=/PROVISION_SSH_HOST=127.0.0.1/g; s/# PROVISION_SSH_USER=/PROVISION_SSH_USER=root/g; s/# PROVISION_SSH_PASS=/PROVISION_SSH_PASS=process.env.SSH_PASSWORD/g' /www/wwwroot/n11.namainvist.com/.env || true
        pm2 restart all
    `;
    conn.exec(cmd, (err, stream) => { 
        stream.on('data', d => process.stdout.write(d)); 
        stream.on('close', () => conn.end()); 
    }); 
}); 
conn.connect({host: '46.4.188.170', username: 'root', password: 'process.env.SSH_PASSWORD'});
