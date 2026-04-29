const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const origFile = '/www/server/panel/vhost/nginx/proxy/namainvist.com/37d98026f6baeb21c7e2aa91300704db_namainvist.com.conf';
const customFile = '/www/server/panel/vhost/nginx/proxy/namainvist.com/custom.conf';

const newConf = `#PROXY-START/
location / {
    proxy_pass http://127.0.0.1:2999;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_http_version 1.1;
    add_header X-Cache $upstream_cache_status;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    add_header Pragma "no-cache";
}
#PROXY-END/
`;

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Write the original proxy conf (overwrite it with clean version)
        const ws = sftp.createWriteStream(origFile);
        ws.write(newConf, 'utf8');
        ws.end();
        ws.on('close', () => {
            console.log('Written new proxy conf!');
            
            // Remove custom.conf
            sftp.unlink(customFile, (err) => {
                if (err) console.log('custom.conf not found or already removed:', err.message);
                else console.log('Deleted custom.conf');
                
                // Reload nginx 
                conn.exec('nginx -t && nginx -s reload', (err2, stream2) => {
                    if (err2) throw err2;
                    let out = '';
                    stream2.on('data', d => out += d.toString());
                    stream2.stderr.on('data', d => out += d.toString());
                    stream2.on('close', () => {
                        console.log('NGINX result:', out);
                        conn.end();
                    });
                });
            });
        });
    });
}).on('error', console.error).connect(config);
