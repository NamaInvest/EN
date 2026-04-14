const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

// Files changed
const FILES = [
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/api/sales/route.ts',
    'src/app/(dashboard)/sales/orders/create/page.tsx',
    'src/app/(dashboard)/price-quotes/page.tsx',
];

// Nodes to update (all tenants use same code)
const NODES = ['n11', 'n1-main', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
const NODE_DIRS = {
    'n11': '/www/wwwroot/n11.namainvist.com',
    'n1-main': '/www/wwwroot/n1.namainvist.com',
    'n2': '/www/wwwroot/n2.namainvist.com',
    'n3': '/www/wwwroot/n3.namainvist.com',
    'n4': '/www/wwwroot/n4.namainvist.com',
    'n5': '/www/wwwroot/n5.namainvist.com',
    'n6': '/www/wwwroot/n6.namainvist.com',
    'n7': '/www/wwwroot/n7.namainvist.com',
    'n8': '/www/wwwroot/n8.namainvist.com',
    'n9': '/www/wwwroot/n9.namainvist.com',
    'n10': '/www/wwwroot/n10.namainvist.com',
};

function sftp_upload(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, err => err ? reject(err) : resolve());
    });
}

function getSftp(c) {
    return new Promise((resolve, reject) => {
        c.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
    });
}

function exec(c, cmd) {
    return new Promise((resolve, reject) => {
        c.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => out += d.toString());
            stream.on('close', () => resolve(out));
        });
    });
}

async function main() {
    const c = new Client();
    await new Promise(r => c.on('ready', r).connect(SERVER));
    const sftp = await getSftp(c);

    console.log('=== Uploading VAT fix files to all nodes ===\n');

    for (const node of NODES) {
        const dir = NODE_DIRS[node];
        process.stdout.write(`📦 ${node}...`);
        let ok = 0;
        for (const file of FILES) {
            const localPath = path.join('d:\\namasoft9-3-main', file);
            const remotePath = `${dir}/${file}`;
            if (!fs.existsSync(localPath)) continue;
            // Ensure remote dir exists
            const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
            await exec(c, `mkdir -p "${remoteDir}"`);
            try {
                await sftp_upload(sftp, localPath, remotePath);
                ok++;
            } catch(e) {
                console.log(`\n   ❌ Failed: ${file} - ${e.message}`);
            }
        }
        console.log(` ${ok}/${FILES.length} files uploaded`);
    }

    console.log('\n=== Building n11 (main reference node) ===');
    console.log('Building... (this may take 3-5 minutes)');
    const buildOut = await exec(c, `cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build 2>&1 | tail -5`);
    console.log(buildOut);

    const buildId = await exec(c, `cat /www/wwwroot/n11.namainvist.com/.next/BUILD_ID 2>/dev/null || echo "FAILED"`);
    if (buildId.trim() === 'FAILED') {
        console.log('❌ n11 build FAILED. Stopping.');
        c.end(); return;
    }
    console.log(`✅ n11 built: ${buildId.trim()}`);

    console.log('\n=== Copying .next to all other nodes ===');
    for (const node of NODES.filter(n => n !== 'n11')) {
        const dir = NODE_DIRS[node];
        const out = await exec(c, `rm -rf "${dir}/.next" && cp -r /www/wwwroot/n11.namainvist.com/.next "${dir}/.next" && echo "OK"`);
        console.log(`${node}: ${out.trim()}`);
    }

    console.log('\n=== Restarting all nodes ===');
    const restartOut = await exec(c, `pm2 restart ${NODES.join(' ')} 2>&1 | tail -3`);
    console.log(restartOut);

    await new Promise(r => setTimeout(r, 8000));

    console.log('\n=== Health Check ===');
    for (const node of NODES) {
        const dir = NODE_DIRS[node];
        const port = dir.includes('n11') ? '3011' :
                     dir.includes('n10') ? '3010' :
                     dir.includes('n1-main') ? '3001' :
                     `300${node.replace('n','')}`;
        const domain = dir.replace('/www/wwwroot/', '');
        const s = await exec(c, `curl -s -o /dev/null -w "%{http_code}" -H "Host: ${domain}" http://localhost:${port}/dashboard --max-time 5 2>/dev/null`);
        console.log(`${node} (port ${port}): HTTP ${s.trim()}`);
    }

    c.end();
    console.log('\n✅ VAT fix deployed to all nodes!');
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
