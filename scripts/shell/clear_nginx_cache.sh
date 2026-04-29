#!/bin/bash
echo "Clearing all nginx proxy caches..."

# AaPanel nginx cache locations
find /tmp -name "nginx*" -delete 2>/dev/null
find /var/cache/nginx -type f -delete 2>/dev/null
find /www/server/nginx/proxy_cache -type f -delete 2>/dev/null
find /www/server/nginx -name "proxy_cache*" -type d -exec rm -rf {} + 2>/dev/null

# Hard restart nginx (AaPanel)
/etc/init.d/nginx restart 2>/dev/null || nginx -s reload 2>/dev/null || service nginx restart 2>/dev/null || true

# Also restart all PM2 processes to clear any in-memory cache
pm2 restart all --update-env

echo "Done! Nginx cache cleared and all services restarted."
