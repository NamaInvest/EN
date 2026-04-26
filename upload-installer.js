const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing: ${cmd}`);
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { process.stdout.write(d); out += d; });
        stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, localPath) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); return r(); }
        
        console.log(`Starting upload of ${path.basename(localPath)}...`);
        sftp.fastPut(localPath, remotePath, {
          step: (transferred, chunk, total) => {
             const percent = ((transferred / total) * 100).toFixed(1);
             process.stdout.write(`\rUploading ${path.basename(localPath)}... ${percent}%`);
          }
        }, (err) => {
          if (err) {
             console.error(`\n[✗]`, remotePath, err.message);
          } else {
             console.log(`\n[✓] Uploaded`, remotePath);
          }
          c.end();
          r();
        });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 });
  });
}

(async () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;
  const exeName = `NamaInvest-Setup-${version}.exe`;
  
  const exePath = `dist-electron/${exeName}`;
  const ymlPath = 'dist-electron/latest.yml';
  const blockmapPath = `dist-electron/${exeName}.blockmap`;
  
  if (!fs.existsSync(exePath)) {
      console.error(`EXE file not found! Expected: ${exePath}. Please build it first.`);
      process.exit(1);
  }

  const bases = [
      '/www/wwwroot/namainvist.com',
      '/www/wwwroot/n11.namainvist.com'
  ];
  
  for (const base of bases) {
      console.log(`\n=== Creating updates directory on ${base} ===`);
      await ssh(`mkdir -p ${base}/public/updates`);
      
      console.log(`\n=== Uploading to ${base} ===`);
      await writeFile(`${base}/public/updates/${exeName}`, exePath);
      
      if (fs.existsSync(ymlPath)) {
          await writeFile(`${base}/public/updates/latest.yml`, ymlPath);
      }
      
      if (fs.existsSync(blockmapPath)) {
          await writeFile(`${base}/public/updates/${exeName}.blockmap`, blockmapPath);
      }
  }
  
  console.log('\n=== All Installer Files Uploaded Successfully ===');
})();
