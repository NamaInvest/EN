const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    let script = `#!/bin/bash
    
mkdir -p /root/sidebars_v2
`;

    for (let i = 1; i <= 10; i++) {
        let backupFile = i === 1 ? '/www/wwwroot/n1_nama_main_backup.tar.gz' : `/www/wwwroot/n${i}_backup_before_hotfix.tar.gz`;
        if(i === 2) backupFile = '/www/wwwroot/n2_backup_before_lang.tar.gz'; // N2
        
        let prefix = i === 1 ? 'nama.namainvist.com' : `n${i}.namainvist.com`;
        // n1 folder was saved as nama.namainvist.com or n1.namainvist.com depending on how we backed it up.
        
        script += `
echo "Extracting Sidebar ${i}..."
cd /www/wwwroot
tar -xf ${backupFile} --wildcards "*src/components/Sidebar.tsx" -O > /root/sidebars_v2/Sidebar_n${i}.tsx
`;
    }

    conn.exec(`cat << 'EOF' > /root/extract_sidebars_v2.sh\n${script}\nEOF\nbash /root/extract_sidebars_v2.sh`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
            console.log('\nExtracted all to /root/sidebars_v2/');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
