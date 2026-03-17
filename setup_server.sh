#!/bin/bash
# 1. Setup PostgreSQL
sudo -u postgres psql -c "CREATE USER namasoft WITH PASSWORD 'Nama2024secure';"
sudo -u postgres psql -c "CREATE DATABASE namadb OWNER namasoft;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE namadb TO namasoft;"
sudo -u postgres psql -d namadb -c "GRANT ALL ON SCHEMA public TO namasoft;"
echo "✅ Database ready!"

# 2. Create app directory
mkdir -p /var/www/namasoft
echo "✅ App directory ready!"

# 3. Setup Nginx
cat > /etc/nginx/sites-available/namasoft << 'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/namasoft /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "✅ Nginx configured!"

# 4. Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable
echo "✅ Firewall configured!"

echo "🎉 Server setup complete!"
