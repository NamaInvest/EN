#!/bin/bash
# Clone the working N3 .next build directly to all broken nodes
# N3 works = its .next is valid. NEXT_PUBLIC_API_URL doesn't exist in this app - confirmed by no URL in N3 JS
# So the .next can be shared safely (no domain baked in)

echo "Starting N3 .next clone to broken nodes..." > /root/n3_clone.log

for i in 2 4 5 6 7 8 9 10; do
  domain="n${i}.namainvist.com"
  dir="/www/wwwroot/${domain}"
  
  if [ -d "$dir" ]; then
    echo "Cloning N3 .next to $domain..." | tee -a /root/n3_clone.log
    
    # Remove old broken .next
    rm -rf "$dir/.next"
    
    # Copy N3's working .next exactly as-is
    cp -r /www/wwwroot/n3.namainvist.com/.next "$dir/.next"
    
    echo "$domain .next cloned OK" | tee -a /root/n3_clone.log
    
    # Restart with N3's build
    pm2 restart "n${i}-main" --update-env
    echo "$domain restarted" | tee -a /root/n3_clone.log
  fi
done

pm2 save
echo "ALL DONE" | tee -a /root/n3_clone.log
