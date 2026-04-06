#!/bin/bash
rm -rf /www/wwwroot/n2.namainvist.com/node_modules
cp -r /www/wwwroot/n1.namainvist.com/node_modules /www/wwwroot/n2.namainvist.com/
cd /www/wwwroot/n2.namainvist.com
/usr/bin/node ./node_modules/.bin/next build > /root/n2_test_build.log 2>&1
pm2 reload n2-main
