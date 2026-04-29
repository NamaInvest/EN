#!/bin/bash
for i in {1..10}
do
  (
    cd /www/wwwroot/n$i.namainvist.com
    npm run build > build_api.log 2>&1
    pm2 restart n$i --update-env
    pm2 restart n$i-whatsapp --update-env
  ) &
done
wait
echo "ALL BUILDS COMPLETED"
