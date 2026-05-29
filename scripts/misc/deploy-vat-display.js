const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const NODES = ['n11', 'n1-main', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
const NODE_DIRS = {
    'n11': '/www/wwwroot/n11.namainvist.com',
    'n1-main': '/www/wwwroot/n1.namainvist.com',
    'n2': '/www/wwwroot/n2.namainvist.com', 'n3': '/www/wwwroot/n3.namainvist.com',
    'n4': '/www/wwwroot/n4.namainvist.com', 'n5': '/www/wwwroot/n5.namainvist.com',
    'n6': '/www/wwwroot/n6.namainvist.com', 'n7': '/www/wwwroot/n7.namainvist.com',
    'n8': '/www/wwwroot/n8.namainvist.com', 'n9': '/www/wwwroot/n9.namainvist.com',
    'n10': '/www/wwwroot/n10.namainvist.com',
};

function sftp_upload(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => sftp.fastPut(localPath, remotePath, e => e ? reject(e) : resolve()));
}
function getSftp(c) {
    return new Promise((resolve, reject) => c.sftp((e, s) => e ? reject(e) : resolve(s)));
}
function exec(c, cmd) {
    return new Promise((resolve, reject) => {
        c.exec(cmd, (e, stream) => {
            if (e) return reject(e);
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

    const FILE = 'src/app/(dashboard)/sales/page.tsx';
    const localPath = path.join('c:\\Users\\1\\Desktop\\alfa', FILE);

    console.log('=== Uploading updated sales/page.tsx to all nodes ===\n');
    for (const node of NODES) {
        const dir = NODE_DIRS[node];
        const remotePath = `${dir}/${FILE}`;
        await exec(c, `mkdir -p "${dir}/src/app/\\(dashboard\\)/sales"`);
        try {
            await sftp_upload(sftp, localPath, remotePath);
            process.stdout.write(`✅ ${node} `);
        } catch(e) { process.stdout.write(`❌ ${node}(${e.message}) `); }
    }
    console.log('\n');

    console.log('=== Building n11 ===');
    const buildOut = await exec(c, `cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build 2>&1 | grep -E "success|error|Error|✓|Route|✗" | tail -5`);
    console.log(buildOut);

    const buildId = await exec(c, `cat /www/wwwroot/n11.namainvist.com/.next/BUILD_ID 2>/dev/null || echo "FAILED"`);
    if (buildId.trim() === 'FAILED') {
        console.log('❌ Build FAILED'); c.end(); return;
    }
    console.log(`✅ Build OK: ${buildId.trim()}`);

    console.log('\n=== Copying .next to all nodes ===');
    for (const node of NODES.filter(n => n !== 'n11')) {
        const dir = NODE_DIRS[node];
        const out = await exec(c, `rm -rf "${dir}/.next" && cp -r /www/wwwroot/n11.namainvist.com/.next "${dir}/.next" && echo OK`);
        process.stdout.write(`${node}: ${out.trim()} `);
    }
    console.log('\n');

    console.log('=== Restarting all nodes ===');
    await exec(c, `pm2 restart ${NODES.join(' ')}`);
    await new Promise(r => setTimeout(r, 7000));

    console.log('\n=== Health check ===');
    const ports = { 'n11': 3011, 'n1-main': 3001, 'n2': 3002, 'n3': 3003, 'n4': 3004, 'n5': 3005, 'n6': 3006, 'n7': 3007, 'n8': 3008, 'n9': 3009, 'n10': 3010 };
    for (const node of NODES) {
        const domain = NODE_DIRS[node].replace('/www/wwwroot/', '');
        const port = ports[node];
        const s = await exec(c, `curl -s -o /dev/null -w "%{http_code}" -H "Host: ${domain}" http://localhost:${port}/dashboard --max-time 5 2>/dev/null`);
        process.stdout.write(`${node}:${s.trim()} `);
    }
    console.log('\n\n✅ Done!');
    c.end();
}

main().catch(e => { console.error(e); });
