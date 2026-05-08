/**
 * Update Clerk keys on production fleet (test -> live)
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const NODES = [
    { path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' },
];

const NEW_PK = 'pk_live_Y2xlcmsubmFtYWludmlzdC5jb20k';
const NEW_SK = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

async function run() {
    console.log('🔗 Connecting to fleet server...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        try {
            for (const node of NODES) {
                console.log(`\n📝 Updating Clerk keys in ${node.path}/.env`);
                
                // Update Clerk publishable key
                let res = await execCommand(conn, 
                    `cd ${node.path} && sed -i 's|^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEW_PK}|' .env`
                );
                
                // Update Clerk secret key
                res = await execCommand(conn, 
                    `cd ${node.path} && sed -i 's|^CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=${NEW_SK}|' .env`
                );
                
                // Verify
                res = await execCommand(conn, `cd ${node.path} && grep CLERK .env`);
                console.log('  Current values:');
                console.log('  ' + res.stdout.trim().split('\n').join('\n  '));
                
                // Restart PM2
                console.log(`  🔄 Restarting ${node.pm2}...`);
                await execCommand(conn, `pm2 restart ${node.pm2}`);
                console.log('  ✅ Done');
            }
            
            console.log('\n🎉 Clerk keys updated on all nodes!');
        } catch (err) {
            console.error('❌ Error:', err);
        } finally {
            conn.end();
        }
    });
    
    conn.on('error', (err) => console.error('❌ Connection error:', err));
    conn.connect(SERVER);
}

run();
