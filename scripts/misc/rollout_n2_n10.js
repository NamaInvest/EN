const { Client } = require('ssh2');

async function rolloutRemaining() {
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log(`[🚀 ROLLOUT PATIENT MIGRATION] Executing sequentially across remaining Nodes...`);
        // We already pushed 'hotfix_node_safe.zip' to '/root/hotfix_node_safe.zip' on the server.
        // So we just need to unzip and build for each one!
        const servers = ['n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
        let p = Promise.resolve();
        
        servers.forEach(nodeName => {
            p = p.then(() => new Promise((resolve) => {
                console.log(`\n================================`);
                console.log(`[🔨 TRIGGER] Node ${nodeName} started...`);
                
                const cmd = `cd /www/wwwroot/${nodeName}.namainvist.com && unzip -o /root/hotfix_node_safe.zip && /usr/bin/npm install && /usr/bin/npm run build && pm2 restart ${nodeName}`;
                
                conn.exec(cmd, (err, stream) => {
                    stream.on('data', d => {
                        let str = d.toString().trim();
                        if(str.includes('build') || str.includes('Restarting') || str.includes('optimized')) {
                            console.log(`[${nodeName} STDOUT] ${str.split('\\n')[0]}`);
                        }
                    });
                    
                    stream.stderr.on('data', d => {
                        let str = d.toString().trim();
                        if(!str.includes('npm WARN') && !str.includes('Debugger')) {
                            console.error(`[${nodeName} STDERR] ${str.split('\\n')[0]}`);
                        }
                    });
                    
                    stream.on('close', (code) => {
                        console.log(`[✅ SUCCESS] ${nodeName} DONE. Exit code: ${code}`);
                        resolve();
                    });
                });
            }));
        });
        
        p.then(() => {
            console.log('\n🌟 ALL REMAINING NODES MIGRTED SUCCESSFULLY!');
            conn.end();
        });
    }).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
}

rolloutRemaining();
