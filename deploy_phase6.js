const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE_ROOT = '/www/wwwroot/namainvist.com';

const RUNTIME_FILES = [
  'src/lib/prisma-audit.ts',
  'src/app/api/audit/field-trail/route.ts'
];

function getSHA256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function execRemote(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '', stderr = '';
      stream.on('data', d => { stdout += d; });
      stream.stderr.on('data', d => { stderr += d; });
      stream.on('close', (code) => {
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const content = fs.readFileSync(localPath);
      
      // Ensure the remote directory path exists
      const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
      execRemote(conn, `mkdir -p ${remoteDir}`).then(() => {
        sftp.writeFile(remotePath, content, (err) => {
          sftp.end();
          if (err) return reject(err);
          resolve();
        });
      }).catch(err => {
        sftp.end();
        reject(err);
      });
    });
  });
}

async function run() {
  console.log('--- Phase 6: Field-Level Audit Trail Deployment & Verification ---');
  
  // 1. Calculate Local SHA256
  console.log('\n[1/5] Calculating Local SHA256 Checksums...');
  const localHashes = {};
  for (const file of RUNTIME_FILES) {
    const fullPath = path.resolve(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: local file not found: ${fullPath}`);
      process.exit(1);
    }
    const hash = getSHA256(fullPath);
    localHashes[file] = hash;
    console.log(`- ${file}: ${hash}`);
  }

  // 2. Connect to Server
  console.log('\n[2/5] Connecting to Hetzner production server via SSH...');
  const conn = new Client();
  
  conn.on('ready', async () => {
    try {
      console.log('✅ Connected successfully!');

      // 3. Upload Runtime Files
      console.log('\n[3/5] Uploading runtime files via SFTP...');
      for (const file of RUNTIME_FILES) {
        const localPath = path.resolve(__dirname, file);
        const remotePath = `${REMOTE_ROOT}/${file}`.replace(/\\/g, '/');
        
        console.log(`Uploading: ${file} -> ${remotePath}`);
        await uploadFile(conn, localPath, remotePath);
      }
      console.log('✅ Upload completed!');

      // 4. Calculate Server SHA256 and Verify Integrity
      console.log('\n[4/5] Verifying remote SHA256 checksums...');
      let hashMismatch = false;
      for (const file of RUNTIME_FILES) {
        const remotePath = `${REMOTE_ROOT}/${file}`.replace(/\\/g, '/');
        const res = await execRemote(conn, `sha256sum ${remotePath}`);
        if (res.code !== 0) {
          console.error(`Error getting sha256sum for ${remotePath}:`, res.stderr);
          hashMismatch = true;
          continue;
        }
        const serverHash = res.stdout.split(' ')[0].trim();
        const localHash = localHashes[file];
        const match = serverHash === localHash;
        console.log(`- ${file}:`);
        console.log(`  Local : ${localHash}`);
        console.log(`  Server: ${serverHash}`);
        console.log(`  Match : ${match ? 'YES (Matched) ✓' : 'NO (MISMATCH) ❌'}`);
        if (!match) hashMismatch = true;
      }

      if (hashMismatch) {
        throw new Error('SHA256 checksum mismatch detected between local and server files!');
      }
      console.log('✅ All checksums verified perfectly!');

      // 5. Remote validations and PM2 restart
      console.log('\n[5/5] Executing post-deployment steps on server...');
      
      // A. Prisma Validate
      console.log('\nRunning: npx prisma validate...');
      const prismaRes = await execRemote(conn, `cd ${REMOTE_ROOT} && npx prisma validate`);
      console.log(`Exit code: ${prismaRes.code}`);
      console.log(prismaRes.stdout);
      if (prismaRes.stderr) console.error(prismaRes.stderr);
      if (prismaRes.code !== 0) throw new Error('npx prisma validate failed on server!');
      console.log('✅ Prisma validation passed on server!');

      // B. npm run build
      console.log('\nRunning: npm run build (Next.js compilation)...');
      const buildRes = await execRemote(conn, `cd ${REMOTE_ROOT} && npm run build`);
      console.log(`Exit code: ${buildRes.code}`);
      console.log(buildRes.stdout.substring(buildRes.stdout.length - 2000)); // print last 2000 chars of build output
      if (buildRes.stderr) console.error(buildRes.stderr);
      if (buildRes.code !== 0) throw new Error('npm run build failed on server!');
      console.log('✅ Next.js production build succeeded!');

      // C. PM2 restart
      const apps = ['main-site', 'n1-main', 'saas-app'];
      for (const app of apps) {
        console.log(`\nRestarting PM2 application: ${app} --update-env...`);
        const restartRes = await execRemote(conn, `pm2 restart ${app} --update-env`);
        console.log(restartRes.stdout);
        if (restartRes.code !== 0) console.error(`Warning: restart failed for ${app}`);
      }
      
      // Wait 3 seconds for apps to boot up completely
      console.log('Waiting 3 seconds for fleet to stabilize...');
      await new Promise(r => setTimeout(r, 3000));

      // D. Verify PM2 List status
      console.log('\nVerifying PM2 list status...');
      const pm2List = await execRemote(conn, `pm2 list`);
      console.log(pm2List.stdout);

      // E. Curl runtime verification
      console.log('\nPerforming Curl Runtime Verification...');
      const curl1 = await execRemote(conn, `curl -s -o /dev/null -w "%{http_code}" https://namainvist.com`);
      console.log(`- https://namainvist.com: HTTP ${curl1.stdout}`);
      
      const curl2 = await execRemote(conn, `curl -s -o /dev/null -w "%{http_code}" https://namainvist.com/api/admin/siem`);
      console.log(`- /api/admin/siem: HTTP ${curl2.stdout}`);

      const curl3 = await execRemote(conn, `curl -s -o /dev/null -w "%{http_code}" https://namainvist.com/api/settings/roles`);
      console.log(`- /api/settings/roles: HTTP ${curl3.stdout}`);

      const curl4 = await execRemote(conn, `curl -s -o /dev/null -w "%{http_code}" https://namainvist.com/api/audit/field-trail`);
      console.log(`- /api/audit/field-trail: HTTP ${curl4.stdout}`);

      // F. Fetch roles body to inspect sensitive data leakage
      console.log('\nChecking roles response for sensitive data leakage...');
      const rolesBody = await execRemote(conn, `curl -s https://namainvist.com/api/settings/roles`);
      const bodyText = rolesBody.stdout;
      
      const leaks = {
        passwordHash: bodyText.includes('passwordHash') || bodyText.includes('password_hash'),
        sessionToken: bodyText.includes('sessionToken') || bodyText.includes('session_token'),
        deviceToken: bodyText.includes('deviceToken') || bodyText.includes('device_token'),
        mfaSecret: bodyText.includes('totpSecret') || bodyText.includes('totp_secret') || bodyText.includes('totpSecretEncrypted')
      };

      console.log(`- passwordHash leaked: ${leaks.passwordHash ? 'YES ❌' : 'NO ✓'}`);
      console.log(`- session/device tokens leaked: ${leaks.sessionToken || leaks.deviceToken ? 'YES ❌' : 'NO ✓'}`);
      console.log(`- MFA secrets leaked: ${leaks.mfaSecret ? 'YES ❌' : 'NO ✓'}`);

      if (leaks.passwordHash || leaks.sessionToken || leaks.deviceToken || leaks.mfaSecret) {
        throw new Error('CRITICAL SECURITY ALERT: Sensitive data leakage detected in roles API!');
      }

      console.log('\n🎉 --- PRODUCTION_FIELD_AUDIT_TRAIL_DEPLOYED_AND_VERIFIED ---');

    } catch (err) {
      console.error('\n❌ Deployment failed with error:', err.message);
    } finally {
      conn.end();
    }
  }).connect(SERVER);
}

run();
