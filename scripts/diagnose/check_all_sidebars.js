const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Extracting Sidebar.tsx from all original backups for comparison...');
    
    let script = `#!/bin/bash
    
mkdir -p /root/sidebars
`;

    // Extract Sidebar from all 10 nodes' backups!
    for (let i = 1; i <= 10; i++) {
        let backupFile = i === 1 ? '/www/wwwroot/n1_nama_main_backup.tar.gz' : `/www/wwwroot/n${i}_backup_before_hotfix.tar.gz`;
        if(i === 2) backupFile = '/www/wwwroot/n2_backup_before_lang.tar.gz'; // N2
        
        script += `
echo "Extracting N${i} Sidebar..."
mkdir -p /root/tmp_n${i}
tar -xzf ${backupFile} -C /root/tmp_n${i} src/components/Sidebar.tsx
cp /root/tmp_n${i}/src/components/Sidebar.tsx /root/sidebars/Sidebar_n${i}.tsx
rm -rf /root/tmp_n${i}
`;
    }

    conn.exec(`cat << 'EOF' > /root/extract_sidebars.sh\n${script}\nEOF\nbash /root/extract_sidebars.sh`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
            console.log('\nAll sidebars extracted to /root/sidebars/');
            
            // Now download them to local machine
            console.log('Downloading sidebars to local disk...');
            conn.sftp((e2, sftp) => {
                if(e2) throw e2;
                
                const require = require('fs');
                if(!require.existsSync('sidebars')) require.mkdirSync('sidebars');
                
                let dlCount = 0;
                for(let i=1; i<=10; i++) {
                    sftp.fastGet(`/root/sidebars/Sidebar_n${i}.tsx`, `sidebars/Sidebar_n${i}.tsx`, e => {
                        dlCount++;
                        if (dlCount === 10) {
                            console.log('✅ All sidebars downloaded successfully.');
                            conn.end();
                        }
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
