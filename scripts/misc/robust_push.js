const { Client } = require('ssh2');
const fs = require('fs');

const nodes = ['n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
let currentIndex = 0;
const conn = new Client();

const pageTsx = fs.readFileSync('c:/Users/1/Desktop/alfa/src/app/(dashboard)/shifts/page.tsx', 'utf8');
const routeTs = fs.readFileSync('c:/Users/1/Desktop/alfa/src/app/api/shifts/route.ts', 'utf8');

const pageTsxB64 = Buffer.from(pageTsx).toString('base64');
const routeTsB64 = Buffer.from(routeTs).toString('base64');

function deployNext() {
    if (currentIndex >= nodes.length) {
        console.log('\\n=== ALL HOTFIXES FINISHED ===');
        conn.end();
        return;
    }

    const node = nodes[currentIndex];
    currentIndex++;
    console.log(`\\n\\n[========== FIXING CORRUPTION ON ${node.toUpperCase()} ==========]`);
    
    const BASE = `/www/wwwroot/${node}.namainvist.com`;
    
    const cmd = `
        echo "1. Writing page.tsx..."
        echo "${pageTsxB64}" | base64 -d > ${BASE}/src/app/\\(dashboard\\)/shifts/page.tsx
        
        echo "2. Writing route.ts..."
        echo "${routeTsB64}" | base64 -d > ${BASE}/src/app/api/shifts/route.ts
        
        echo "3. Rebuilding Next.js..."
        cd ${BASE}
        rm -rf .next
        npm run build 2>&1 | tail -n 10
        
        echo "4. Restarting PM2..."
        pm2 restart ${node} 2>&1 | head -n 3
    `;

    conn.exec(cmd, (err, stream) => {
        if(err) { console.error(err); deployNext(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => deployNext());
    });
}

conn.on('ready', () => {
    deployNext();
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
