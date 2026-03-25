const { Client } = require('ssh2');
const fs = require('fs');

const files = {
    'SessionGuard.tsx': fs.readFileSync('src/components/SessionGuard.tsx', 'utf8'),
    'route.ts': fs.readFileSync('src/app/api/auth/me/route.ts', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('Orchestrating SSO propagation to all tenant nodes...');

    // Retrieve active nodes dynamically
    conn.exec('ls -d /www/wwwroot/tenant_n* 2>/dev/null', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', data => output += data.toString());
        stream.on('close', () => {
            const tenantPaths = output.trim().split('\n').filter(p => p && p.includes('tenant_n') && !p.endsWith('tenant_n1'));
            if (tenantPaths.length === 0) {
                console.log('✅ No additional nodes found. Propagation complete.');
                conn.end();
                return;
            }

            console.log(\`Found \${tenantPaths.length} tenant nodes. Starting sequential injection...\`);
            
            conn.sftp((err, sftp) => {
                if (err) throw err;

                const uploadFile = (path, content) => new Promise((resolve) => {
                    const writeStream = sftp.createWriteStream(path);
                    writeStream.write(content);
                    writeStream.end();
                    writeStream.on('close', resolve);
                });

                const buildNode = (tenantPath) => new Promise((resolve) => {
                    const nodeNameMatch = tenantPath.match(/tenant_(n\\d+)/);
                    if (!nodeNameMatch) return resolve();
                    const nodeName = nodeNameMatch[1];
                    
                    console.log(\`Processing \${nodeName}...\`);
                    const execCmd = \`
                        mkdir -p \${tenantPath}/src/app/api/auth/me &&
                        echo "Building \${nodeName}..." &&
                        cd \${tenantPath} && npm run build && pm2 restart \${nodeName} --update-env
                    \`;
                    conn.exec(execCmd, (err, execStream) => {
                        if (err) return resolve();
                        execStream.on('close', () => {
                            console.log(\`✅ \${nodeName} Completed.\`);
                            resolve();
                        });
                    });
                });

                async function processQueue() {
                    for (const tenantPath of tenantPaths) {
                        try {
                            // Ensure structure exists first via SSH
                            await new Promise(r => conn.exec(\`mkdir -p \${tenantPath}/src/app/api/auth/me\`, (e, s) => s.on('close', r)));
                            
                            // Inject modified files
                            await uploadFile(\`\${tenantPath}/src/components/SessionGuard.tsx\`, files['SessionGuard.tsx']);
                            await uploadFile(\`\${tenantPath}/src/app/api/auth/me/route.ts\`, files['route.ts']);
                            
                            // Rebuild and restart Next.js instance sequentially
                            await buildNode(tenantPath);
                        } catch (e) {
                            console.error(\`Failed on \${tenantPath}: \${e.message}\`);
                        }
                    }
                    console.log("🟦 ALL TENANT NODES SYNCHRONIZED AND RESTARTED 🟦");
                    conn.end();
                }

                processQueue();
            });
        });
    });

}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
