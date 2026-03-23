const { Client } = require('ssh2');
const fs = require('fs');

const servers = [
    { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' },
];

const basePath = process.cwd();

async function deployToServer(server) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected via SSH...`);
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                const remoteBase = `/www/wwwroot/${server.name.toLowerCase()}.namainvist.com`;
                
                sftp.fastPut(basePath + '/mcp-server.mjs', remoteBase + '/mcp-server.mjs', (err) => {
                    if (err) console.error(err);
                    console.log(`[${server.name}] Uploaded mcp-server.mjs. Installing SDK...`);
                    conn.exec(`cd ${remoteBase} && npm install @modelcontextprotocol/sdk --save`, (err, stream) => {
                        stream.on('close', () => {
                            console.log(`[${server.name}] MCP Setup complete! Starting background MCP bridge if needed.`);
                            // We don't restart PM2 because MCP runs as a separate bridge process for local AI
                            conn.end();
                            resolve();
                        });
                    });
                });
            });
        }).on('error', (err) => resolve()).connect(server);
    });
}

(async () => {
    console.log("Deploying MCP Core to N-Cluster...");
    await Promise.allSettled(servers.map(deployToServer));
    console.log("Deployment complete.");
})();
