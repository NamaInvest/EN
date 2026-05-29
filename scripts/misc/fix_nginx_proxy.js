const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

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

    # AGGRESSIVE NO-CACHE for HTML
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    add_header Pragma "no-cache";

    # Static files - short cache of 5 minutes MAX
    set $static_fileBOQTrkH1 0;
    if ( $uri ~* "\\.(gif|png|jpg|css|woff|woff2)$" ) {
        set $static_fileBOQTrkH1 1;
        expires 5m;
    }
    # JS files - NO CACHE EVER (they contain our app code)
    if ( $uri ~* "\\.js$" ) {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires -1;
    }
}
#PROXY-END/
`;

const conn = new Client();
conn.on('ready', () => {
    const origFile = '/www/server/panel/vhost/nginx/proxy/namainvist.com/37d98026f6baeb21c7e2aa91300704db_namainvist.com.conf';
    
    // Backup original and write new one
    conn.exec(`cp ${origFile} ${origFile}.bak && echo "${newConf.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" > ${origFile}`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            // Better approach - write via SFTP
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                // Write to a temp file first
                const tmpFile = '/tmp/nginx_proxy_fixed.conf';
                const writeStream = sftp.createWriteStream(tmpFile);
                writeStream.write(newConf, 'utf8');
                writeStream.end();
                writeStream.on('close', () => {
                    // Copy to destination and delete custom.conf (to avoid duplicates)
                    conn.exec(`cp /tmp/nginx_proxy_fixed.conf ${origFile} && rm -f /www/server/panel/vhost/nginx/proxy/namainvist.com/custom.conf && nginx -t && nginx -s reload && echo "SUCCESS"`, (err2, stream2) => {
                        if (err2) throw err2;
                        let out = '';
                        stream2.on('data', d => out += d.toString());
                        stream2.on('close', () => {
                            console.log('Result:', out);
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).on('error', console.error).connect(config);
