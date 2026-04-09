import { exec } from 'child_process';
import fs from 'fs';
import { Client } from 'ssh2';
import path from 'path';

// Output path will be the conversation's scratch directory
const logFile = 'C:\\Users\\1\\.gemini\\antigravity\\brain\\92fd3d73-9f2a-4eb7-84b9-8bcc3ebb32e7\\scratch\\DIAGNOSTIC_RESULTS.txt';
// Ensure dir exists
if (!fs.existsSync(path.dirname(logFile))) fs.mkdirSync(path.dirname(logFile), { recursive: true });

console.log('🤖 Initiating Full Diagnostic Suite (TypeScript + Pre-build Checks + Remote PM2)...');
console.log('⏳ Please wait up to 60 seconds for the deep scan to complete...');

let results = '=== NAMA ERP DIAGNOSTIC RESULTS ===\n\n';

const runLocalTS = () => new Promise(resolve => {
    console.log('➤ [1/2] Analyzing TypeScript Source Code (npx tsc --noEmit)...');
    exec('npx tsc --noEmit', { shell: 'cmd.exe', maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
        results += '--- TYPESCRIPT ERRORS ---\n' + (stdout || 'No Typescript Errors Found! \n') + '\n\n';
        resolve();
    });
});

const runRemoteLogs = () => new Promise(resolve => {
    console.log('➤ [2/2] Fetching Remote N11 & N1 PM2 Runtime Logs via SSH...');
    const conn = new Client();
    conn.on('ready', () => {
        // Fetch logs for N11 first, and N1 just in case N11 doesn't have logs yet
        conn.exec('pm2 logs n11 --lines 100 --nostream && pm2 logs n1 --lines 50 --nostream', (err, stream) => {
            let output = '';
            stream.on('data', d => output += d);
            stream.stderr.on('data', d => output += d);
            stream.on('close', () => {
                results += '--- PM2 RUNTIME LOGS ---\n' + output + '\n\n';
                conn.end();
                resolve();
            });
        });
    }).on('error', (err) => {
        results += '--- PM2 RUNTIME LOGS ---\nFailed to connect: ' + err.message + '\n\n';
        resolve();
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
});

async function main() {
    await runLocalTS();
    await runRemoteLogs();
    
    fs.writeFileSync(logFile, results, 'utf8');
    console.log('');
    console.log('✅ Diagnostic finished successfully!');
    console.log('📊 Logs saved for the AI to analyze!');
}

main();
