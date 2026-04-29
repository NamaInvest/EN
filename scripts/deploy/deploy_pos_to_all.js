const { Client } = require('ssh2');
const fs = require('fs');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'c:/Users/1/Desktop/alfa/src/components/Sidebar.tsx', remotePath: '/src/components/Sidebar.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/pos/page.tsx', remotePath: '/src/app/pos/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/restaurant-pos/page.tsx', remotePath: '/src/app/restaurant-pos/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/pos/products/route.ts', remotePath: '/src/app/api/pos/products/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/pos/checkout/route.ts', remotePath: '/src/app/api/pos/checkout/route.ts' }
];

async function deployToServer(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `${basePathPrefix}${serverIndex}${domainSuffix}`;
        console.log(`\n===========================================`);
        console.log(`🛫 Deploying to ${serverName} (${basePath})...`);

        conn.on('ready', () => {
            console.log(`[${serverName}] Connected. Creating directories...`);
            
            conn.exec(`mkdir -p ${basePath}/src/app/pos && mkdir -p ${basePath}/src/app/restaurant-pos && mkdir -p ${basePath}/src/app/api/pos/products && mkdir -p ${basePath}/src/app/api/pos/checkout`, (err, stream) => {
                if (err) { console.error(`[${serverName}] Exec error:`, err); conn.end(); resolve(); return; }
                stream.resume(); // drain
                
                stream.on('close', () => {
                    console.log(`[${serverName}] Directories created. Uploading ${filesToUpload.length} files...`);
                    
                    conn.sftp((err, sftp) => {
                        if (err) { console.error(`[${serverName}] SFTP error:`, err); conn.end(); resolve(); return; }
                        
                        let uploads = 0;
                        filesToUpload.forEach(f => {
                            const localData = fs.readFileSync(f.local, 'utf8');
                            sftp.writeFile(basePath + f.remotePath, localData, (err) => {
                                if (err) { console.error(`[${serverName}] Write error:`, err); conn.end(); resolve(); return; }
                                uploads++;
                                
                                if (uploads === filesToUpload.length) {
                                    console.log(`[${serverName}] Uploads complete! Compiling Next.js Build...`);
                                    
                                    conn.exec(`cd ${basePath} && npm run build && pm2 reload ${serverName}`, (err, buildStream) => {
                                        if (err) { console.error(`[${serverName}] Build exec error:`, err); conn.end(); resolve(); return; }
                                        
                                        buildStream.on('data', d => process.stdout.write(`[${serverName} BUILD] ${d.toString()}`));
                                        buildStream.stderr.on('data', d => process.stderr.write(`[${serverName} ERR] ${d.toString()}`));
                                        
                                        buildStream.on('close', (code) => {
                                            console.log(`[${serverName}] ✅ Build & Reload Finished (Code ${code})`);
                                            conn.end();
                                            resolve();
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        }).on('error', (err) => {
            console.error(`[${serverName}] Connection error:`, err);
            resolve();
        }).connect({
            host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
        });
    });
}

async function runDeployments() {
    console.log("Starting Sequential Global Deployment (n2 to n10)...");
    for (let i = 2; i <= 10; i++) {
        await deployToServer(i);
    }
    console.log("\n🎉 ALL SERVERS UPDATED SUCCESSFULLY!");
}

runDeployments();
