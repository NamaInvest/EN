const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Sending URGENT RESTORE command to all nodes...');
    let script = `#!/bin/bash\n`;
    
    // N1 - N10
    for (let i = 1; i <= 10; i++) {
        if (i === 2) continue; // Skip N2
        
        let backupFile = `/www/wwwroot/n${i}_backup_before_hotfix.tar.gz`;
        let dest = `/www/wwwroot`;
        let folder = `/www/wwwroot/n${i}.namainvist.com`;
        let pm2Name = `n${i}-main`;
        
        if (i === 1) {
            backupFile = `/www/wwwroot/n1_nama_main_backup.tar.gz`;
            folder = `/www/wwwroot/n1.namainvist.com`;
            pm2Name = `nama-main`;
        }

        script += `(
  echo "Restoring Node ${i} from ${backupFile}..."
  cd ${dest}
  tar -xzf ${backupFile}
  echo "Rebuilding Node ${i}..."
  cd ${folder}
  npm run build
  pm2 restart ${pm2Name} || pm2 restart n${i}
  echo "RESTORE DONE FOR N${i}"
) > /root/restore_n${i}.log 2>&1 &\n`;
    }

    conn.exec(`cat << 'EOF' > /root/restore_fleet.sh\n${script}\nEOF\nbash /root/restore_fleet.sh`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log(d.toString()));
        stream.on('close', () => {
            console.log('✅ URGENT RESTORE RUNNING IN BACKGROUND ON ALL SERVERS!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
