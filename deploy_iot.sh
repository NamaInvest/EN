#!/bin/bash
cd /www/wwwroot/n11.namainvist.com
tar -xzf update_kanban.tar.gz
rm update_kanban.tar.gz

su - postgres -c "psql -d n11_db -f /www/wwwroot/n11.namainvist.com/update_iot.sql"
su - postgres -c "psql -d n11_db -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n11_db;'"

npm run build
pm2 restart saas-app
