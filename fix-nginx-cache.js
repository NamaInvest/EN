const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== Step 1: Find Nginx cache directory ==="
    # Check nginx.conf for proxy_cache_path
    grep -r "proxy_cache_path\\|proxy_cache_zone\\|proxy_cache " /www/server/nginx/conf/ 2>/dev/null | head -10
    grep -r "proxy_cache_path" /etc/nginx/ 2>/dev/null | head -5

    # Common aaPanel cache locations
    ls -la /www/server/nginx/proxy_cache_dir/ 2>/dev/null && echo "Found: /www/server/nginx/proxy_cache_dir/" || echo "Not at proxy_cache_dir"
    ls -la /var/cache/nginx/ 2>/dev/null && echo "Found: /var/cache/nginx/" || echo "Not at /var/cache/nginx"
    ls -la /tmp/nginx_cache/ 2>/dev/null || echo "Not at /tmp/nginx_cache"
    
    echo ""
    echo "=== Step 2: Check all nginx configs for cache settings ==="
    grep -r "proxy_cache\\|cache_keys_zone\\|X-Cache" /www/server/nginx/ 2>/dev/null | grep -v ".conf.bak" | head -20
    
    echo ""
    echo "=== Step 3: Disable proxy cache in proxy.conf ==="
    cat > /www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf << 'EOF'
location / {
    proxy_pass http://127.0.0.1:2999;
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
    
    # Remove upstream cache headers
    proxy_hide_header Cache-Control;
    proxy_hide_header X-Nextjs-Cache;
    proxy_hide_header X-Nextjs-Prerender;
    proxy_hide_header X-Nextjs-Stale-Time;
    proxy_hide_header Pragma;
    proxy_hide_header Expires;
    proxy_hide_header ETag;
    proxy_hide_header Last-Modified;
    
    # Force no-cache on all responses
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header CDN-Cache-Control "no-store" always;
    add_header Cloudflare-CDN-Cache-Control "no-store" always;
}
EOF
    echo "✅ proxy.conf updated (cache disabled)"
    
    echo ""
    echo "=== Step 4: Find and clear Nginx cache files ==="
    # Find all cached files for namainvist.com
    CACHE_DIRS=$(grep -r "proxy_cache_path" /www/server/nginx/conf/ /etc/nginx/ 2>/dev/null | grep -o '"[^"]*"\\|/[^ ]*' | grep "/" | head -5)
    echo "Cache dirs from config: $CACHE_DIRS"
    
    # Try common locations
    for dir in /www/server/nginx/proxy_cache_dir /var/cache/nginx /tmp/nginx/cache /www/server/nginx/conf/nginx.conf; do
      if [ -d "$dir" ]; then
        echo "Clearing: $dir"
        find "$dir" -type f -delete 2>/dev/null && echo "✅ Cleared $dir" || echo "❌ Failed to clear $dir"
      fi
    done
    
    echo ""
    echo "=== Step 5: Test Nginx config & reload ==="
    nginx -t 2>&1 | tail -3
    systemctl reload nginx 2>&1 || nginx -s reload 2>&1
    echo "✅ Nginx reloaded"
    
    sleep 2
    
    echo ""
    echo "=== Step 6: Verify - Nginx now serving NEW content for / ==="
    SIZE_ROOT=$(curl -s -H "Host: namainvist.com" http://localhost:80/ 2>/dev/null | wc -c)
    SIZE_QS=$(curl -s -H "Host: namainvist.com" "http://localhost:80/?v=test" 2>/dev/null | wc -c)
    echo "Nginx / size: $SIZE_ROOT bytes (should be ~138000+)"
    echo "Nginx /?v=test size: $SIZE_QS bytes"
    
    XCACHE=$(curl -sI -H "Host: namainvist.com" http://localhost:80/ 2>/dev/null | grep -i "x-cache\\|x-nextjs-cache")
    echo "Cache headers: $XCACHE"
    
    # Check if new content is being served
    CONTENT_CHECK=$(curl -s -H "Host: namainvist.com" http://localhost:80/ 2>/dev/null | python3 -c "
import sys
html = sys.stdin.read()
print('Has 104:', '104' in html)
print('Has dark bg:', '0f172a' in html)
print('Has old 73 qism:', '73 قسم' in html)
print('Body length:', len(html))
" 2>/dev/null)
    echo "$CONTENT_CHECK"
  `;
  
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write('[ERR] ' + d.toString()));
    stream.on('close', () => { c.end(); });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
