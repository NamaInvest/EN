/**
 * deploy.js — Nama Invest ERP — SCP Deploy Script
 * Protocol: SCP (SFTP subsystem over SSH — same protocol as scp command)
 * Usage: node scripts/deploy/deploy.js file1 file2 ... [--build] [--restart]
 * 
 * ✅ RULE: Always use this script for deploying to 46.4.188.170
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE_BASE = '/www/wwwroot/namainvist.com';

const args = process.argv.slice(2);
const doBuild = args.includes('--build');
const doRestart = args.includes('--restart') || doBuild;
const files = args.filter(a => !a.startsWith('--'));

if (files.length === 0 && !doBuild && !doRestart) {
    console.log('Usage: node scripts/deploy/deploy.js [files...] [--build] [--restart]');
    process.exit(1);
}

const conn = new Client();
conn.on('error', e => { console.error('SSH error:', e.message); process.exit(1); });

conn.on('ready', async () => {
    console.log(`🔌 Connected to ${SERVER.host} via SCP`);
    try {
        if (files.length > 0) await uploadFiles();
        if (doBuild) await runCommand(`cd ${REMOTE_BASE} && npm run build 2>&1 | tail -5`, '📦 Build');
        if (doRestart) await runCommand(`pm2 restart main-site && sleep 1 && pm2 list | grep main-site`, '🚀 PM2');
        conn.end();
        console.log('=== DEPLOY COMPLETE ✅ ===');
    } catch (e) {
        console.error('Deploy failed:', e.message || e);
        conn.end();
        process.exit(1);
    }
});

async function uploadFiles() {
    const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));
    for (const localFile of files) {
        const remotePath = `${REMOTE_BASE}/${localFile.replace(/\\/g, '/')}`;
        const remoteDir = remotePath.split('/').slice(0, -1).join('/');
        // Create directory
        await runCommand(`mkdir -p "${remoteDir}"`, null);
        // SCP upload
        await new Promise((res, rej) => {
            const data = fs.readFileSync(localFile);
            const ws = sftp.createWriteStream(remotePath);
            ws.on('close', () => { console.log(`✅ SCP: ${localFile.split('/').pop()} → ${remotePath}`); res(); });
            ws.on('error', rej);
            ws.write(data); ws.end();
        });
    }
}

function runCommand(cmd, label) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('data', d => out += d);
            stream.stderr.on('data', d => out += d);
            stream.on('close', (code) => {
                if (label) {
                    const ok = out.includes('online') || out.includes('Route') || out.includes('Static') || out.includes('compiled') || code === 0;
                    console.log(`${label}: ${ok ? 'OK ✅' : out.trim().slice(-120)}`);
                }
                res(out);
            });
        });
    });
}

conn.connect(SERVER);
