const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Uploading zatca-sdk-v4.zip to N1...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = 'c:/Users/1/Desktop/alfa/zatca-sdk-v4.zip';
        const remotePath = '/root/zatca-sdk-v4.zip';
        
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) throw err;
            console.log('Upload complete! Running Python Extractor...');
            
            const pyScript = `
import zipfile
import os

os.makedirs('/root/zatca-sdk-v4', exist_ok=True)
with zipfile.ZipFile('/root/zatca-sdk-v4.zip', 'r') as zf:
    for info in zf.infolist():
        new_name = info.filename.replace('\\\\', '/')
        dest_path = os.path.join('/root/zatca-sdk-v4', new_name)
        
        if info.filename.endswith('/') or info.filename.endswith('\\\\'):
            os.makedirs(dest_path, exist_ok=True)
            continue
            
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, 'wb') as f:
            f.write(zf.read(info.filename))
print("Extraction via Python finished!")
`;

            const b64 = Buffer.from(pyScript).toString('base64');
            const bash = `echo "${b64}" | base64 -d > /root/extract_v4.py && python3 /root/extract_v4.py && find /root/zatca-sdk-v4 -name "fatoora" -type f`;

            conn.exec(bash, (err, stream) => {
                if (err) throw err;
                
                let outputStr = '';
                stream.on('data', data => {
                    const out = data.toString();
                    console.log(out);
                    outputStr += out;
                });
                
                stream.on('close', () => {
                    const lines = outputStr.split('\\n');
                    const fatooraPath = lines.find(line => line.includes('fatoora') && !line.includes('Extraction'));
                    if (fatooraPath) {
                        console.log('Found new fatoora at:', fatooraPath);
                        conn.exec(`chmod +x ${fatooraPath.trim()} && ln -sf ${fatooraPath.trim()} /usr/local/bin/fatoora && /usr/local/bin/fatoora -help | head -n 5`, (e, s) => {
                            s.on('data', d => console.log(d.toString()));
                            s.on('close', () => conn.end());
                        });
                    } else {
                        console.error('Could not auto-find fatoora executable!');
                        conn.end();
                    }
                }).stderr.on('data', data => console.error(data.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000});
