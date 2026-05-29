const { exec } = require('child_process');
const { Client } = require('ssh2');

console.log("Starting full reboot sequence for all servers...");

const servers = [
  { name: 'Server 1 (95.217.187.44)', command: 'C:\\Windows\\System32\\OpenSSH\\ssh.exe -i C:\\Users\\1\\.ssh\\hetzner_key -o StrictHostKeyChecking=no root@95.217.187.44 "reboot"' },
  { name: 'Server 2 (204.168.144.74)', command: 'C:\\Windows\\System32\\OpenSSH\\ssh.exe -i C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key -o StrictHostKeyChecking=no root@204.168.144.74 "reboot"' },
  { name: 'Server 3 (185.197.195.202)', command: 'C:\\Windows\\System32\\OpenSSH\\ssh.exe -i C:\\Users\\1\\.ssh\\id_ed25519_deploy -o StrictHostKeyChecking=no root@185.197.195.202 "reboot"' }
];

servers.forEach(server => {
  console.log(`Sending reboot command to ${server.name}...`);
  exec(server.command, (err, stdout, stderr) => {
      // ssh usually exits with 255 on remote connection closed (which is what happens on reboot)
      console.log(`[Reboot command sent to: ${server.name}]`);
  });
});

console.log("Sending reboot command to N1-N11 server (46.4.188.170)...");
const conn = new Client();
conn.on('error', (err) => {
    console.log('[N1-N11 server] SSH Connection closed/error (this is expected during reboot):', err.message);
});

conn.on('ready', () => {
    conn.exec('reboot', (err, stream) => {
        if (err) {
            console.error('[N1-N11 server] Exec Error:', err);
            return conn.end();
        }
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => {
            console.log('[N1-N11 server] SSH connection closed');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 10000 
});
