const {Client} = require('ssh2');
const fs = require('fs');
const path = require('path');
const HOST = '46.4.188.170';
const PASS = '_ee4SWbxLVfH9b';
const APP_PATH = '/www/wwwroot/n11.namainvist.com';
const EXE_PATH = 'd:\\namasoft9-3-main\\dist\\NamaInvest-Setup-2.2.1.exe';
const YML_PATH = 'd:\\namasoft9-3-main\\dist\\latest.yml';

function execCmd(client, cmd) {
    return new Promise((resolve, reject) => {
        client.exec(cmd, (err, stream) => {
            if (err) reject(err);
            let data = '';
            stream.on('data', d => data += d.toString());
            stream.stderr.on('data', d => data += d.toString());
            stream.on('close', () => resolve(data.trim()));
        });
    });
}

const c = new Client();
c.on('ready', async () => {
    console.log('Connected to server');
    await execCmd(c, `mkdir -p ${APP_PATH}/public/updates`);
    
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }
        
        console.log('Uploading NamaInvest-Setup-2.2.1.exe (~1.6GB)...');
        console.log('This will take several minutes...');
        
        const exeSize = fs.statSync(EXE_PATH).size;
        let uploaded = 0;
        const readStream = fs.createReadStream(EXE_PATH);
        const writeStream = sftp.createWriteStream(`${APP_PATH}/public/updates/NamaInvest-Setup-2.2.1.exe`);
        
        readStream.on('data', chunk => {
            uploaded += chunk.length;
            const pct = ((uploaded / exeSize) * 100).toFixed(1);
            process.stdout.write(`\r📤 ${pct}% (${(uploaded/1024/1024).toFixed(0)}MB / ${(exeSize/1024/1024).toFixed(0)}MB)`);
        });
        
        readStream.pipe(writeStream);
        
        writeStream.on('close', () => {
            console.log('\n✅ EXE uploaded!');
            
            // Upload latest.yml
            const yml = fs.readFileSync(YML_PATH);
            sftp.writeFile(`${APP_PATH}/public/updates/latest.yml`, yml, async (err2) => {
                if (err2) console.error('❌ latest.yml', err2.message);
                else console.log('✅ latest.yml uploaded!');
                
                console.log('\n✅ All done! Ready to shutdown.');
                c.end();
            });
        });
        
        writeStream.on('error', e => { console.error('Upload error:', e.message); c.end(); });
    });
});
c.on('error', e => console.error('Connection error:', e.message));
c.connect({ host: HOST, port: 22, username: 'root', password: PASS });
