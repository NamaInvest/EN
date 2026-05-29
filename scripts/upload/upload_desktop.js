const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

const config = {
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: 'process.env.SSH_PASSWORD'
};

async function upload() {
  const sftp = new SftpClient();
  try {
    console.log('Connecting to server 46.4.188.170...');
    await sftp.connect(config);
    
    const remoteDir = '/www/wwwroot/namainvist.com/public/updates/desktop';
    console.log(`Checking if remote directory exists: ${remoteDir}`);
    const dirExists = await sftp.exists(remoteDir);
    if (!dirExists) {
      await sftp.mkdir(remoteDir, true);
      console.log('Created remote directory.');
    }

    const localExe = path.join(__dirname, 'dist-electron', 'NamaInvest-Setup-2.4.3.exe');
    const remoteExe = `${remoteDir}/NamaInvest-Setup-2.4.3.exe`;
    
    const localYml = path.join(__dirname, 'dist-electron', 'latest.yml');
    const remoteYml = `${remoteDir}/latest.yml`;

    console.log('Uploading Setup Exe (This will take a while, ~760MB)...');
    await sftp.fastPut(localExe, remoteExe, {
      step: (total_transferred, chunk, total) => {
        process.stdout.write(`Transferred: ${(total_transferred / 1024 / 1024).toFixed(2)} MB\r`);
      }
    });
    console.log('\nUploaded Setup Exe successfully!');

    console.log('Uploading latest.yml...');
    await sftp.fastPut(localYml, remoteYml);
    console.log('Uploaded latest.yml successfully!');
    
    console.log('All files uploaded! Auto-update is now live.');
  } catch (err) {
    console.error('Upload failed:', err);
  } finally {
    await sftp.end();
  }
}

upload();
