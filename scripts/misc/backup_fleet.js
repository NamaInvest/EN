const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Fleet. Starting parallel backups of all nodes...');
    let backupScript = `#!/bin/bash\n`;
    for (let i = 1; i <= 10; i++) {
        if (i === 2) continue; // N2 was our test dummy
        // Create tar.gz backups for each node
        backupScript += `(
  echo "Backing up Node ${i}..."
  cd /www/wwwroot
  tar -czf n${i}_backup_before_hotfix.tar.gz n${i}.namainvist.com --exclude=n${i}.namainvist.com/node_modules --exclude=n${i}.namainvist.com/.next 
  echo "Node ${i} backup complete (node_modules & .next excluded to save space)."
) > /root/backup_n${i}.log 2>&1 &\n`;
    }
    
    // Add N1 specifically which is 'nama-main' folder internally too
    backupScript += `(
  echo "Backing up N1/nama-main..."
  cd /www/wwwroot
  tar -czf n1_nama_main_backup.tar.gz n1.namainvist.com --exclude=n1.namainvist.com/node_modules
) > /root/backup_n1_specific.log 2>&1 &\n`;

    conn.exec(`cat << 'EOF' > /root/backup_fleet.sh\n${backupScript}\nEOF\nbash /root/backup_fleet.sh`, (err, stream) => {
        stream.on('data', d => console.log(d.toString()));
        stream.on('close', () => {
            console.log('✅ Backups are running in the background!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
