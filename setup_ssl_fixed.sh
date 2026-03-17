#!/bin/bash
DOMAIN="namainvest.duckdns.org"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -q certbot python3-certbot-nginx

echo ""
echo "=== 3. CONFIGURE NGINX FOR DOMAIN ==="
cat > /etc/nginx/sites-available/namasoft << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

nginx -t && systemctl reload nginx

echo ""
echo "=== 4. OBTAIN SSL CERTIFICATE ==="
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m ialqrashi62@gmail.com --redirect

echo ""
echo "=== DONE ==="
