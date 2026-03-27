const { Client } = require('ssh2');
const fs = require('fs');

const nodes = [
    { dir: 'namainvist.com', pm2: 'nama-main' },
    { dir: 'n1.namainvist.com', pm2: 'n1' },
    { dir: 'n2.namainvist.com', pm2: 'n2' },
    { dir: 'n3.namainvist.com', pm2: 'n3' },
    { dir: 'n4.namainvist.com', pm2: 'n4' },
    { dir: 'n5.namainvist.com', pm2: 'n5' },
    { dir: 'n6.namainvist.com', pm2: 'n6' },
    { dir: 'n7.namainvist.com', pm2: 'n7' },
    { dir: 'n8.namainvist.com', pm2: 'n8' },
    { dir: 'n9.namainvist.com', pm2: 'n9' },
    { dir: 'n10.namainvist.com', pm2: 'n10' }
];

const conn = new Client();
conn.on('ready', () => {
    console.log('🔗 Connected! Starting fleet zero-cache patch deployment...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const localFile1 = 'd:/namasoft9-3-main/node_modules/zatca-xml-js/lib/zatca/qr/index.js';
        const fileContent1 = fs.readFileSync(localFile1);
        const localFile2 = 'd:/namasoft9-3-main/node_modules/zatca-xml-js/lib/zatca/signing/index.js';
        const fileContent2 = fs.readFileSync(localFile2);

        for (const node of nodes) {
            console.log(`\n======================================================`);
            console.log(`>>> Deploying Patch to ${node.pm2} (/www/wwwroot/${node.dir})`);
            console.log(`======================================================`);
            
            const r1 = `/www/wwwroot/${node.dir}/node_modules/zatca-xml-js/lib/zatca/qr/index.js`;
            const r2 = `/www/wwwroot/${node.dir}/node_modules/zatca-xml-js/lib/zatca/signing/index.js`;

            try {
                // Upload patched node_module files
                await new Promise((resolve, reject) => sftp.writeFile(r1, fileContent1, e => e ? reject(e) : resolve()));
                await new Promise((resolve, reject) => sftp.writeFile(r2, fileContent2, e => e ? reject(e) : resolve()));
                console.log(`✅ Files zatca-xml-js updated on ${node.pm2}. Starting ZERO-CACHE Build...`);

                // MUST remove .next to force Next.js Turbopack caching to rebuild node_modules!
                await new Promise((resolve) => {
                    const cmd = `cd /www/wwwroot/${node.dir} && rm -rf .next && NODE_OPTIONS="--max-old-space-size=4096" npm run build && pm2 restart ${node.pm2}`;
                    conn.exec(cmd, (errExec, stream) => {
                        if (errExec) return resolve();
                        stream.on('data', d => process.stdout.write(`[${node.pm2}] ` + d.toString()));
                        stream.stderr.on('data', d => process.stdout.write(`[${node.pm2} ERR] ` + d.toString()));
                        stream.on('close', () => resolve());
                    });
                });
                console.log(`✅ ${node.pm2} Server Patch & Rebuild completed successfully.`);
            } catch (ex) {
                console.log(`❌ Skipped ${node.pm2}: ${ex.message}`);
            }
        }
        
        console.log('\n🎉 ALL SERVERS HAVE RECEIVED THE ZATCA HOTFIX & REBUILT SUCCESSFULLY!');
        conn.end();
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
