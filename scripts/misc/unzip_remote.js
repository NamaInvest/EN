const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Run Python Extractor');
    
    // Base64 the python script to prevent any escaping issues
    const pyScript = `
import zipfile
import os

os.makedirs('/root/zatca-sdk', exist_ok=True)
with zipfile.ZipFile('/root/zatca-sdk.zip', 'r') as zf:
    for info in zf.infolist():
        new_name = info.filename.replace('\\\\', '/')
        dest_path = os.path.join('/root/zatca-sdk', new_name)
        
        # If the file is just a directory representation, skip
        if info.filename.endswith('/') or info.filename.endswith('\\\\'):
            os.makedirs(dest_path, exist_ok=True)
            continue
            
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, 'wb') as f:
            f.write(zf.read(info.filename))
print("Extraction via Python finished!")
`;

    const b64 = Buffer.from(pyScript).toString('base64');
    
    const bash = `echo "${b64}" | base64 -d > /root/extract.py && python3 /root/extract.py && chmod +x /root/zatca-sdk/fatoora && ln -sf /root/zatca-sdk/fatoora /usr/local/bin/fatoora && /usr/local/bin/fatoora -help | head -n 5`;

    conn.exec(bash, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
