#!/bin/bash
echo "Starting deployment to n1..n10"
for i in {1..10}
do
  DOMAIN="n$i.namainvist.com"
  DIR="/www/wwwroot/$DOMAIN"
  
  if [ -d "$DIR" ]; then
    echo "Updating $DOMAIN..."
    cp /root/route.ts "$DIR/src/app/api/products/route.ts"
    cp /root/page.tsx "$DIR/src/app/(dashboard)/products/page.tsx"
    
    # Run npm install just to be completely safe with newer packages
    (
      cd "$DIR"
      npm install qrcode.react
    ) &
  else
    echo "Directory $DIR does not exist, skipping..."
  fi
done
wait
echo "All files copied and packages installed. Triggering build_all.sh..."
chmod +x /root/build_all.sh
/root/build_all.sh
