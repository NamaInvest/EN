const { Client } = require('ssh2');

const CLERK_PUB = 'pk_live_Y2xlcmsubmFtYWludmlzdC5jb20k';
const CLERK_SEC = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

// Fix all n2-n11 nodes: add Clerk keys if missing, then rebuild and restart
const nodes = [
    { name: 'n2',  port: 3002, pm2: 'n2-main'    },
    { name: 'n3',  port: 3003, pm2: 'n3-main'    },
    { name: 'n4',  port: 3004, pm2: 'n4-main'    },
    { name: 'n5',  port: 3005, pm2: 'n5-main'    },
    { name: 'n6',  port: 3006, pm2: 'n6-main'    },
    { name: 'n7',  port: 3007, pm2: 'tenant-n7'  },
    { name: 'n8',  port: 3008, pm2: 'n8-main'    },
    { name: 'n9',  port: 3009, pm2: 'n9-main'    },
    { name: 'n10', port: 3010, pm2: 'n10-main'   },
    { name: 'n11', port: 3011, pm2: 'tenant-n11' },
];

const fixScript = nodes.map(n => `
echo "=== Fixing ${n.name} ==="
DIR="/www/wwwroot/${n.name}.namainvist.com"
ENV_FILE="$DIR/.env"

# Add Clerk keys if missing
if ! grep -q "CLERK_SECRET_KEY" "$ENV_FILE" 2>/dev/null; then
    echo "" >> "$ENV_FILE"
    echo 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${CLERK_PUB}"' >> "$ENV_FILE"
    echo 'CLERK_SECRET_KEY="${CLERK_SEC}"' >> "$ENV_FILE"
    echo 'NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"' >> "$ENV_FILE"
    echo 'NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"' >> "$ENV_FILE"
    echo "Clerk keys added to ${n.name}"
else
    echo "Clerk keys already in ${n.name}"
fi
`).join('\n');

const conn = new Client();
conn.on('ready', () => {
    console.log('Adding Clerk keys to all nodes...');
    conn.exec(fixScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
            console.log('Keys added. Now rebuilding N11 (most urgent)...');
            const rebuildCmd = `
cd /www/wwwroot/n11.namainvist.com
rm -rf .next
npm run build > /tmp/n11_rebuild.log 2>&1
pm2 restart tenant-n11
echo "N11 rebuild launched in background!"
`;
            conn.exec(`nohup bash -c '${rebuildCmd.replace(/'/g, "'\\''")}' > /tmp/n11_fix.log 2>&1 &`, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d));
                s2.on('close', () => {
                    console.log('N11 rebuild started. Monitor: /tmp/n11_rebuild.log');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
