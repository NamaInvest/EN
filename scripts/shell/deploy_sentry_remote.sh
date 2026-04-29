#!/bin/bash
cd /var/www/namasoft
unzip -o deploy_sentry.zip
rm deploy_sentry.zip
npm install
npm run build > /tmp/build_sync.log 2>&1
pm2 restart namasoft
pm2 restart namasoft2
echo DONE >> /tmp/build_sync.log
