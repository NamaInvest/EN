const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const REMOTE_DIR = '/www/wwwroot/namainvist.com';

const FILES_TO_UPLOAD = [
  'public/downloads/NamaInvest-Setup.exe',
  'public/updates/desktop/NamaInvest-Setup-2.4.8.exe',
  'public/updates/desktop/latest.yml',
  'public/updates/desktop/NamaInvest-Setup-2.4.8.exe.blockmap'
];

function exec(conn, cmd, timeout = 300000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { resolve(); }, timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); resolve(); return; }
      stream.on('close', () => { clearTimeout(t); resolve(); });
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, s) => err ? reject(err) : resolve(s)));
}

function uploadFile(s, local, remote) {
  return new Promise((resolve, reject) => {
    s.fastPut(local, remote, {
      step: (total_transferred, chunk, total) => {
        // console.log(`Transferred ${total_transferred} / ${total}`);
      }
    }, e => e ? reject(e) : resolve())
  });
}

async function main() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('✅ Connected');
    
    await exec(conn, `mkdir -p ${REMOTE_DIR}/public/downloads`, 5000);
    await exec(conn, `mkdir -p ${REMOTE_DIR}/public/updates/desktop`, 5000);

    const s = await getSftp(conn);
    for (const f of FILES_TO_UPLOAD) {
      const local = path.resolve(__dirname, f);
      if (fs.existsSync(local)) {
        console.log(`Uploading ${f}...`);
        await uploadFile(s, local, `${REMOTE_DIR}/${f}`);
        console.log(`✅ Uploaded ${f}`);
      }
    }

    conn.end();
  });

  conn.on('error', e => console.error('Connection error:', e.message));
  conn.connect(SERVER);
}

main().catch(console.error);
