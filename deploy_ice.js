const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    // The proxy config is included inside namainvist.com server block
    // We need to add subdomain check INSIDE the location / block
    const proxyConfig = `# Subdomain auth guard - redirect to /login if no token cookie
# This check runs BEFORE proxy_pass
set $tenant_redirect "";
if ($host ~ "^(.+)\\.namainvist\\.com$") {
    set $tenant_redirect "sub";
}
if ($host = "namainvist.com") {
    set $tenant_redirect "";
}
if ($host = "www.namainvist.com") {
    set $tenant_redirect "";
}

# Don't redirect public paths
if ($uri = /login) {
    set $tenant_redirect "";
}
if ($uri ~ ^/api/) {
    set $tenant_redirect "";
}
if ($uri ~ ^/auto-login) {
    set $tenant_redirect "";
}
if ($uri ~ ^/_next/) {
    set $tenant_redirect "";
}
if ($uri ~ ^/uploads/) {
    set $tenant_redirect "";
}
if ($uri ~ ^/sign-in) {
    set $tenant_redirect "";
}
if ($uri ~ ^/sign-up) {
    set $tenant_redirect "";
}

# If subdomain + has token cookie → let through
if ($cookie_token) {
    set $tenant_redirect "";
}

# Execute redirect
if ($tenant_redirect = "sub") {
    return 302 /login;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # DISABLE ALL NGINX PROXY CACHING
    proxy_cache off;
    proxy_no_cache 1;
    proxy_cache_bypass 1;
    add_header X-Cache "DISABLED" always;
    
    proxy_hide_header Cache-Control;
    proxy_hide_header X-Nextjs-Cache;
    proxy_hide_header X-Nextjs-Prerender;
    proxy_hide_header X-Nextjs-Stale-Time;
    proxy_hide_header Pragma;
    proxy_hide_header Expires;
    proxy_hide_header ETag;
    proxy_hide_header Last-Modified;
    
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header CDN-Cache-Control "no-store" always;
    add_header Cloudflare-CDN-Cache-Control "no-store" always;
}
`;
    c.sftp((e, sftp) => {
        sftp.writeFile('/www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf', proxyConfig, (err) => {
            if (err) { console.log('❌', err.message); c.end(); return; }
            console.log('✅ proxy.conf updated with subdomain guard');
            sftp.end();
            // Remove the wildcard config (not needed)
            c.exec('rm -f /www/server/panel/vhost/nginx/wildcard.namainvist.com.conf && nginx -t 2>&1 && nginx -s reload 2>&1 && echo "OK" || echo "FAIL"', (e, s) => {
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => c.end());
            });
        });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
