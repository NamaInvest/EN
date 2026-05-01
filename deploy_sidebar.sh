#!/bin/bash
cd /www/wwwroot/n11.namainvist.com
tar -xzf update_sidebar.tar.gz
rm update_sidebar.tar.gz
npm run build
pm2 restart saas-app
