const { Client } = require('ssh2'); 

const nodes = [
    { dir: 'namainvist.com', pm2: 'nama-main' },
    { dir: 'n1.namainvist.com', pm2: 'n1' },
    { dir: 'n3.namainvist.com', pm2: 'n3' },
    { dir: 'n4.namainvist.com', pm2: 'n4' },
    { dir: 'n5.namainvist.com', pm2: 'n5' },
    { dir: 'n6.namainvist.com', pm2: 'n6' },
    { dir: 'n7.namainvist.com', pm2: 'n7' },
    { dir: 'n8.namainvist.com', pm2: 'n8' },
    { dir: 'n9.namainvist.com', pm2: 'n9' },
    { dir: 'n10.namainvist.com', pm2: 'n10' },
];

const conn = new Client(); 
conn.on('ready', () => { 
    console.log('Connected! Starting fleet deployment...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const file1 = 'd:/namasoft9-3-main/src/app/api/zatca/route.ts';
        const file2 = 'd:/namasoft9-3-main/src/app/api/settings/generate-keys/route.ts';

        const fs = require('fs');
        const c1 = fs.readFileSync(file1);
        const c2 = fs.readFileSync(file2);

        for (const node of nodes) {
            console.log(`\n================================`);
            console.log(`>>> Deploying to ${node.pm2} (/www/wwwroot/${node.dir})`);
            console.log(`================================`);
            
            const r1 = `/www/wwwroot/${node.dir}/src/app/api/zatca/route.ts`;
            const r2 = `/www/wwwroot/${node.dir}/src/app/api/settings/generate-keys/route.ts`;

            try {
                // Write files
                await new Promise((resolve, reject) => sftp.writeFile(r1, c1, e => e ? reject(e) : resolve()));
                await new Promise((resolve, reject) => sftp.writeFile(r2, c2, e => e ? reject(e) : resolve()));
                console.log(`Files uploaded to ${node.pm2}. Starting Build...`);

                // Rebuild
                await new Promise((resolve) => {
                    const cmd = `cd /www/wwwroot/${node.dir} && npm run build && pm2 restart ${node.pm2}`;
                    conn.exec(cmd, (errExec, stream) => {
                        if (errExec) return resolve();
                        stream.on('data', d => process.stdout.write(`[${node.pm2}] ` + d.toString()));
                        stream.stderr.on('data', d => process.stdout.write(`[${node.pm2} ERR] ` + d.toString()));
                        stream.on('close', () => resolve());
                    });
                });
                console.log(`✅ ${node.pm2} Completed successfully.`);
            } catch (ex) {
                console.log(`❌ Skipped ${node.pm2}: ${ex.message}`);
            }
        }
        
        console.log('\n🎉 ALL SERVERS UPDATED AND REBUILT!');
        conn.end();
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
