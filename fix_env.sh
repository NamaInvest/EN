#!/bin/bash
# Fix NEXT_PUBLIC_API_URL in .env for all broken nodes

for i in 2 4 5 6 7 8 9 10; do
  domain="n${i}.namainvist.com"
  envFile="/www/wwwroot/${domain}/.env"
  port=$((3000 + i))

  if [ -f "$envFile" ]; then
    echo "Fixing ${domain}..."
    # Fix the NEXT_PUBLIC_API_URL to match the correct domain
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=\"https://${domain}\"|g" "$envFile"
    sed -i "s|PORT=.*|PORT=${port}|g" "$envFile"
    echo "  Done: $(grep NEXT_PUBLIC_API_URL $envFile)"
  else
    # Create .env from scratch
    echo "Creating .env for ${domain}..."
    cat > "$envFile" << EOF
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n${i}_db?schema=public"
NEXT_PUBLIC_API_URL="https://${domain}"
PORT=${port}
EOF
    echo "  Created."
  fi
done

echo "Restarting all affected PM2 processes..."
pm2 restart n2-main n4-main n5-main n6-main n7-main n8-main n9-main n10-main
pm2 save
echo "ALL DONE!"
