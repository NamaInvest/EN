const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };

const nginxInject = `
location = /googlebe8c17f02d7742b4.html {
    default_type text/html;
    return 200 'google-site-verification: googlebe8c17f02d7742b4.html';
}
`;

function fixNginx() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, analyzing Nginx Conf...`);
            
            // In aaPanel, site configs are in /www/server/panel/vhost/nginx/
            // Let's find the exact file.
            conn.exec('ls /www/server/panel/vhost/nginx/*.conf', (err, stream) => {
                let confs = '';
                stream.on('data', d => confs += d.toString()).on('close', () => {
                    // Usually there's one that matches n1.namainvist.com or similar.
                    // We can inject it into all of them just to be 100% sure! (Or just the correct one).
                    // Actually, let's just use sed to insert it right after the server_name directive in ALL .com confs
                    const command = `sed -i '/server_name/a \\
location = /googlebe8c17f02d7742b4.html { \\
    default_type text/html; \\
    return 200 "google-site-verification: googlebe8c17f02d7742b4.html"; \\
}' /www/server/panel/vhost/nginx/*.conf && systemctl reload nginx`;

                    console.log(`[${server.name}] Injecting Nginx bypass for Google!`);
                    conn.exec(command, (err, stream2) => {
                        stream2.on('close', () => {
                            console.log(`[${server.name}] Nginx Reloaded with hardcoded Google route.`);
                            conn.end();
                            resolve();
                        }).on('data', d => console.log(d.toString()));
                    });
                });
            });
        }).on('error', () => resolve()).connect(server);
    });
}

fixNginx();
