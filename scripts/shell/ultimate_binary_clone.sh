#!/bin/bash
echo "Starting Ultimate Binary Clone from N1..."
for i in {2..10}; do
    domain="n${i}.namainvist.com"
    echo "Cloning to ${domain}..."
    rsync -aq --delete --exclude='.env' --exclude='logs' --exclude='.user.ini' /www/wwwroot/n1.namainvist.com/ /www/wwwroot/${domain}/
    echo "Reloading pm2 for ${domain}..."
    pm2 reload "n${i}-main"
done
pm2 save
echo "All done! CSS successfully imported across the fleet."
