#!/bin/bash
NODE=/usr/bin/node
echo "" > /root/final_fix.log

for i in 2 4 5 6 7 8 9 10; do
  domain="n${i}.namainvist.com"
  dir="/www/wwwroot/${domain}"
  port=$((3000 + i))

  echo "=== FIXING $domain ===" | tee -a /root/final_fix.log
  
  # Step 1: Write .env from scratch (no cat, no heredoc issues)
  python3 -c "
f = open('$dir/.env', 'w')
f.write('DATABASE_URL=\"postgresql://postgres:RootPassNama123@localhost:5432/n${i}_db?schema=public\"\n')
f.write('NEXT_PUBLIC_API_URL=\"https://$domain\"\n')
f.write('PORT=$port\n')
f.write('NEXTAUTH_SECRET=\"namasecret2024\"\n')
f.write('NEXTAUTH_URL=\"https://$domain\"\n')
f.close()
print('env written')
" | tee -a /root/final_fix.log

  echo "ENV content:" | tee -a /root/final_fix.log
  cat "$dir/.env" | tee -a /root/final_fix.log
  
  # Step 2: Copy node_modules from N1 (guaranteed to have tailwind)
  echo "Syncing node_modules from N1..." | tee -a /root/final_fix.log
  rsync -aq /www/wwwroot/n1.namainvist.com/node_modules/ "$dir/node_modules/"
  
  # Step 3: Clean .next
  rm -rf "$dir/.next"
  
  # Step 4: Build with the correct .env in place
  echo "Building $domain..." | tee -a /root/final_fix.log
  cd "$dir"
  $NODE ./node_modules/.bin/next build >> /root/final_fix.log 2>&1
  
  if [ $? -eq 0 ]; then
    echo "$domain BUILD OK" | tee -a /root/final_fix.log
  else
    echo "$domain BUILD FAILED" | tee -a /root/final_fix.log
  fi
  
  pm2 restart "n${i}-main" --update-env
done

pm2 save
echo "COMPLETE" | tee -a /root/final_fix.log
