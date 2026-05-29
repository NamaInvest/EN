/**
 * Full Sync: Upload ALL src/ files + config to server via SFTP
 * Then rebuild and restart
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const REMOTE_BASE = '/www/wwwroot/namainvist.com';
const LOCAL_BASE = process.cwd();

// Files/dirs to sync
const SYNC_DIRS = ['src', 'prisma', 'public'];
const SYNC_FILES = [
  'middleware.ts', 'next.config.ts', 'package.json', 'tsconfig.json',
  'package-lock.json', 'sentry.client.config.ts', 'sentry.server.config.ts',
  'sentry.edge.config.ts', 'instrumentation.ts', 'instrumentation-client.ts',
];

// Exclusions
const EXCLUDE = ['.next', 'node_modules', '.git', '.agent', '.agents', '.gemini', 'check-ssh2.js', 'deploy.js'];

function shouldExclude(relPath) {
  return EXCLUDE.some(ex => relPath.startsWith(ex) || relPath.includes(`/${ex}/`) || relPath.includes(`\\${ex}\\`));
}

function getAllFiles(dir, base = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath).replace(/\\/g, '/');
    if (shouldExclude(relPath)) continue;
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, base));
    } else {
      results.push({ local: fullPath, remote: `${REMOTE_BASE}/${path.relative(LOCAL_BASE, fullPath).replace(/\\/g, '/')}` });
    }
  }
  return results;
}

function mkdirp(sftp, remotePath) {
  return new Promise((resolve) => {
    sftp.mkdir(remotePath, (err) => resolve());
  });
}

async function ensureRemoteDir(sftp, remotePath) {
  const parts = path.dirname(remotePath).split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += '/' + part;
    await mkdirp(sftp, current);
  }
}

async function uploadFile(sftp, localPath, remotePath) {
  await ensureRemoteDir(sftp, remotePath);
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(localPath);
    sftp.writeFile(remotePath, content, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function main() {
  console.log('🔍 Collecting files to sync...');
  
  // Collect all files
  let allFiles = [];
  for (const dir of SYNC_DIRS) {
    const dirPath = path.join(LOCAL_BASE, dir);
    if (fs.existsSync(dirPath)) {
      allFiles.push(...getAllFiles(dirPath, LOCAL_BASE));
    }
  }
  for (const file of SYNC_FILES) {
    const filePath = path.join(LOCAL_BASE, file);
    if (fs.existsSync(filePath)) {
      allFiles.push({ local: filePath, remote: `${REMOTE_BASE}/${file}` });
    }
  }

  console.log(`📦 Found ${allFiles.length} files to sync`);

  const conn = new Client();
  conn.on('ready', () => {
    console.log('✅ SSH Connected');
    conn.sftp(async (err, sftp) => {
      if (err) { console.error('SFTP error:', err); conn.end(); return; }
      
      const start = Date.now();
      let uploaded = 0;
      let failed = 0;
      const batchSize = 50;
      
      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        const promises = batch.map(async (file) => {
          try {
            await uploadFile(sftp, file.local, file.remote);
            uploaded++;
          } catch (e) {
            failed++;
          }
        });
        await Promise.all(promises);
        
        const pct = Math.round(((i + batch.length) / allFiles.length) * 100);
        process.stdout.write(`\r  📤 ${uploaded}/${allFiles.length} (${pct}%) — ${failed} failed`);
      }
      
      console.log(`\n\n✅ Upload complete: ${uploaded} files in ${((Date.now() - start) / 1000).toFixed(1)}s (${failed} failed)`);
      
      // Now rebuild
      console.log('\n🔨 Building on server (4GB heap)...');
      conn.exec(`cd ${REMOTE_BASE} && pm2 stop main-site n1-main saas-app 2>/dev/null; export NODE_OPTIONS="--max-old-space-size=4096" && npm run build 2>&1 | tail -10 && pm2 restart main-site n1-main saas-app && sleep 3 && pm2 list`, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          console.log('\n🎉 Full sync + rebuild complete!');
          conn.end();
        });
      });
    });
  });
  
  conn.on('error', e => console.error('SSH error:', e.message));
  conn.connect(SERVER);
}

main();
