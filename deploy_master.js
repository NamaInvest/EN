const { Client } = require('ssh2');
const { execSync } = require('child_process');
const fs = require('fs');

const PS_PATH = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

async function orchestrate() {
    console.log("Packaging local source code to update_payload.zip...");
    try {
        if (fs.existsSync('update_payload.zip')) fs.unlinkSync('update_payload.zip');
        // Compress src folder using absolute PowerShell path to avoid PATH issues
        execSync(`"${PS_PATH}" -Command "Compress-Archive -Path src -DestinationPath update_payload.zip -Force"`, { stdio: 'inherit' });
        console.log("Successfully created update_payload.zip!");
    } catch (e) {
        console.error("Failed to compress source files:", e.message);
        return;
    }

    if (!fs.existsSync('update_payload.zip')) throw new Error("update_payload.zip does not exist!");

    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    console.log('Broadcasting update_payload.zip across all 10 production shards...');
                    const uploadPromises = [];
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = `/www/wwwroot/${t}.namainvist.com`;
                        const remote = `${rootPath}/update_payload.zip`;
                        
                        // We use Promise.all here safely because it is exactly ONE file per tenant = 10 channels max
                        uploadPromises.push(new Promise((resUp, rejUp) => {
                            sftp.fastPut('update_payload.zip', remote, e => e ? rejUp(e) : resUp());
                        }));
                        console.log(`Queued bulk archive payload for ${t}`);
                    }
                    
                    console.log('Waiting for all parallel SFTP uploads to finish...');
                    await Promise.all(uploadPromises);
                    console.log("✅ All 10 tenants received update_payload.zip.");

                    // trigger compile and unpack
                    console.log("Triggering global concurrent unpack, compilation, and restart...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    unzip -o update_payload.zip -d .;', // Extracts /src/* natively 
                        '    rm update_payload.zip;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_full_update.log 2>&1 &',
                        'done'
                    ].join(' ');
                    
                    conn.exec(buildCmd, (err, stream) => {
                        if (err) throw err;
                        stream.resume();
                        stream.on('close', () => {
                            console.log("🚀 Servers are now unpacking, compiling, and restarting in the background!");
                            console.log("Check Hetzner /root/build_n$i_full_update.log for progress.");
                            conn.end();
                            resolve();
                        });
                    });

                } catch (e) {
                    console.error("Deployment Error:", e);
                    conn.end();
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
        });
    });
}

console.log("Starting Master Synchronization using Archive Payload...");
orchestrate()
  .then(() => {
    console.log('Master Deployment Script Fired Successfully!');
    try { fs.unlinkSync('update_payload.zip'); } catch(e){} // Cleanup
  })
  .catch(e => console.error(e));
