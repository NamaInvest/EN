#!/bin/bash
cd /www/wwwroot/n11.namainvist.com
tar -xzf update_dt.tar.gz
rm update_dt.tar.gz
npm run build
pm2 restart saas-app
