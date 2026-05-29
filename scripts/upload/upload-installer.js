const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const version = require('./package.json').version;
const localFile = path.join(__dirname, 'dist-electron', `NamaInvest-Setup-${version}.exe`);
const remoteFile = `/www/wwwroot/namainvist.com/public/updates/desktop/NamaInvest-Setup-${version}.exe`;
const blockmapFile = path.join(__dirname, 'dist-electron', `NamaInvest-Setup-${version}.exe.blockmap`);
const remoteBlockmapFile = `/www/wwwroot/namainvist.com/public/updates/desktop/NamaInvest-Setup-${version}.exe.blockmap`;
const latestYml = path.join(__dirname, 'dist-electron', 'latest.yml');
const remoteLatestYml = `/www/wwwroot/namainvist.com/public/updates/desktop/latest.yml`;

console.log(`Starting upload for version ${version}...`);

function uploadFile(local, remote) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(local)) {
      console.log(`File not found: ${local}`);
      return resolve();
    }
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) {
          c.end();
          return reject(err);
        }
        
        console.log(`Uploading ${local} to ${remote}...`);
        
        sftp.fastPut(local, remote, {
          step: (total_transferred, chunk, total) => {
            const percent = Math.round((total_transferred / total) * 100);
            process.stdout.write(`\rProgress: ${percent}%`);
          }
        }, (err) => {
          c.end();
          if (err) return reject(err);
          console.log(`\nSuccessfully uploaded: ${remote}`);
          resolve();
        });
      });
    }).connect({
      host: '46.4.188.170',
      port: 22,
      username: 'root',
      password: 'process.env.SSH_PASSWORD'
    });
  });
}

async function run() {
  try {
    await uploadFile(latestYml, remoteLatestYml);
    await uploadFile(blockmapFile, remoteBlockmapFile);
    await uploadFile(localFile, remoteFile);
    console.log('All files uploaded successfully.');
  } catch (e) {
    console.error('Error uploading files:', e);
  }
}

run();
