#!/bin/bash
DOMAIN="namainvest.duckdns.org"
TOKEN="47704216-ea9a-42c4-8120-15b73761675d"

echo "=== 1. SETUP DUCKDNS CRON ==="
mkdir -p /root/duckdns
cat > /root/duckdns/duck.sh << EOF
echo url="https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=" | curl -k -o /root/duckdns/duck.log -K -
EOF
chmod 700 /root/duckdns/duck.sh

# Add to cron if not exists
(crontab -l 2>/dev/null | grep -v 'duck.sh'; echo "*/5 * * * * /root/duckdns/duck.sh >/dev/null 2>&1") | crontab -
/root/duckdns/duck.sh
echo "DuckDNS auto-updater configured."

echo ""
echo "=== 2. INSTALL CERTBOT ==="
apt-get update
apt-get install -y certbot python3-certbot-nginx

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
