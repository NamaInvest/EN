const { Client } = require('ssh2');

const servers = [
    { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' }
];

const basePath = process.cwd();

async function deployToServer(server) {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected...`);
            conn.sftp((err, sftp) => {
                if (err) return resolve();
                const nginxRoot = `/www/wwwroot/${server.name.toLowerCase()}.namainvist.com`; 
                const nextjsPublic = `${nginxRoot}/public`;
                const standalonePublic = `${nginxRoot}/.next/standalone/public`;
                const localFile = basePath + '/public/googlebe8c17f02d7742b4.html';
                
                // Copy to NGINX Root (takes priority if configured properly)
                sftp.fastPut(localFile, nginxRoot + '/googlebe8c17f02d7742b4.html', () => {
                    // Copy to NextJS Public (if standard start)
                    sftp.fastPut(localFile, nextjsPublic + '/googlebe8c17f02d7742b4.html', () => {
                        // Copy to Standalone Public (if standalone output)
                        sftp.fastPut(localFile, standalonePublic + '/googlebe8c17f02d7742b4.html', () => {
                            console.log(`[${server.name}] Uploaded Google Verification string everywhere!`);
                            conn.end();
                            resolve();
                        });
                    });
                });
            });
        }).on('error', () => resolve()).connect(server);
    });
}

(async () => {
    console.log("Uploading verification...");
    await Promise.allSettled(servers.map(deployToServer));
    console.log("Upload Complete.");
})();
