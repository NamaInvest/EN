const { Client } = require('ssh2');
const conn = new Client();

const nodes = ['n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
let currentIndex = 0;

function deployNext() {
    if (currentIndex >= nodes.length) {
        console.log('\\n\\n=== ALL DEPLOYMENTS COMPLETED ===');
        conn.end();
        return;
    }

    const node = nodes[currentIndex];
    currentIndex++;
    console.log(`\\n\\n[========== DEPLOYING ${node.toUpperCase()} ==========]`);
    
    const base = `/www/wwwroot/${node}.namainvist.com`;
    const cmd = `
        echo "1. Checking directory..."
        if [ ! -d "${base}" ]; then echo "Directory ${base} not found. Skipping."; exit 0; fi

        echo "2. Copying files from n3..."
        cp /www/wwwroot/n3.namainvist.com/src/lib/translations.ts ${base}/src/lib/translations.ts
        cp /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx ${base}/src/lib/i18n.tsx
        cp /www/wwwroot/n3.namainvist.com/src/app/\\(dashboard\\)/layout.tsx ${base}/src/app/\\(dashboard\\)/layout.tsx

        echo "3. Disabling reactCompiler..."
        sed -i 's/reactCompiler: true/reactCompiler: false/g' ${base}/next.config.ts
        grep reactCompiler ${base}/next.config.ts || true

        echo "4. Removing .next and rebuilding..."
        cd ${base}
        rm -rf .next
        npm run build 2>&1 | tail -n 10

        echo "5. Restarting ${node}..."
        pm2 restart ${node}
        sleep 2
        pm2 show ${node} | grep status
        
        echo "Done for ${node}."
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) { 
            console.error('Exec error:', err); 
            deployNext(); 
            return; 
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { 
            deployNext(); 
        });
    });
}

conn.on('ready', () => {
    console.log('SSH Ready. Starting sequential deployment...');
    deployNext();
}).connect({ 
    host: '46.4.188.170', 
    port: 22, 
    username: 'root', 
    password: '_ee4SWbxLVfH9b', 
    readyTimeout: 15000 
});
