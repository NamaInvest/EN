const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to server...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const cmd = 'cd /var/www/namasoft && tar -czf /root/backup_live.tar.gz --exclude=node_modules --exclude=.next --exclude=.git --exclude=tmp_scp_out .';
  console.log(`Executing: ${cmd}`);
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code) => {
      console.log('Tar creation finished with code ' + code);
      if (code !== 0) {
        conn.end();
        return;
      }
      
      console.log('Downloading tar file...');
      conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastGet('/root/backup_live.tar.gz', 'd:\\backup_live.tar.gz', (err) => {
          if (err) {
            console.error('Download failed', err);
            conn.end();
            return;
          }
          console.log('Download complete!');
          conn.end();
        });
      });
      
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '185.197.195.202',
  port: 22,
  username: 'root',
  password: 'VmJUML2LuezRSws'
});
